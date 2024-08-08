import * as vscode from 'vscode';
import * as crypto from 'crypto';
import axios from 'axios';

export function showTooltip(editor: vscode.TextEditor, text: string, position: vscode.Position, duration: number = 5000) {
	const decorationType = vscode.window.createTextEditorDecorationType({
		after: {
			contentText: text,
			margin: '0 0 0 20px',
			textDecoration: 'none; border-radius: 5px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5); padding: 6px'
		}
	});

	editor.setDecorations(decorationType, [{ range: new vscode.Range(position, position) }]);

	setTimeout(() => {
		decorationType.dispose();
	}, duration);
}



export function showInfo(message: string) {
	vscode.window.showInformationMessage(
		message,
		'复制',
		'关闭'
	).then(selected => {
		switch (selected) {
			case '关闭':
				break;
			case '复制':
				vscode.env.clipboard.writeText(message).then(() => {
					// vscode.window.showInformationMessage('消息内容已复制到剪贴板！');
				}, err => {
					vscode.window.showErrorMessage('复制到剪贴板失败: ' + err.message);
				});
				break;
			default:
				break;
		}
	});
}



function isFirstCharEnglish(word: string): boolean {
	return /^[A-Za-z]/.test(word[0]);
}

function isFirstCharChinese(word: string): boolean {
	return /^[\u4e00-\u9fff]/.test(word[0]);
}

function participles(word: string): string {
	if (!word.trim()) return word;
	const wordList = word.trim().split(/(?<=[a-z])(?=[A-Z])|[\-_<>\n]/).map(word => word.toLowerCase().trim());
	// console.log(wordList);
	const words = wordList.filter(item => item.trim() !== '').join(' ');
	return words;

}

export async function fanyiByYoudao(word: string): Promise<string> {
	/**
	 * 使用有道翻译 WEB API 获取翻译结果
	 */
	const words = participles(word);

	let lang = ['AUTO', 'AUTO'];
	if (isFirstCharEnglish(words)) {
		lang = ['en', 'zh-CHS'];
	} else if (isFirstCharChinese(words)) {
		lang = ['zh-CHS', 'en'];
	}
	const headers = {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
		'Referer': 'http://fanyi.youdao.com/',
		'Cookie': 'OUTFOX_SEARCH_USER_ID=-148473857@10.169.0.83; JSESSIONID=aaafbpaaZm1Q5-_wxwLgx; OUTFOX_SEARCH_USER_ID_NCOO=982336911.512214; ___rl__test__cookies=1587617780880',
	};

	const ts = String(Date.now());
	const salt = ts + String(Math.floor(Math.random() * 10));

	const sign = crypto.createHash('md5').update(`fanyideskweb${words}${salt}Y2FYu%TNSbMCxc3t2u^XT`).digest('hex');

	const data = {
		i: words,
		from: lang[0],
		to: lang[1],
		smartresult: 'dict',
		client: 'fanyideskweb',
		salt: salt,
		sign: sign,
		ts: ts,
		bv: crypto.createHash('md5').update(headers['User-Agent']).digest('hex'),
		doctype: 'json',
		version: '2.1',
		keyfrom: 'fanyi.web',
		action: 'FY_BY_CLICKBUTTION'
	};

	try {
		const response = await axios.post('http://fanyi.youdao.com/translate_o?smartresult=dict&smartresult=rule', new URLSearchParams(data as any), { headers });
		const res = response.data.translateResult;
		return res ? res[0].map((r: any) => r.tgt).join('') : '翻译时出错';
	} catch (error: any) {
		return 'error info 2: ' + error.message;
	}
}


export async function fanyiByBaidu(appid: string, key: string, word: string): Promise<string> {
	/**
	 * 使用百度翻译API 获取翻译结果 https://fanyi-api.baidu.com/manage/developer
	 */
	if (!appid || !key) {
		return '请先配置 API Key';
	}
	if (!word) {
		return '翻译内容不能为空';
	}


	const query = participles(word);
	const salt = new Date().getTime();
	// 生成签名
	const str1 = appid + query + salt + key;
	const sign = crypto.createHash('md5').update(str1).digest('hex');

	let from = 'en';
	let to = 'zh';

	if (isFirstCharEnglish(query)) {
		from = 'en';
		to = 'zh';
	} else if (isFirstCharChinese(query)) {
		from = 'zh';
		to = 'en';
	}

	const params = {
		q: query,
		appid: appid,
		salt: salt,
		from: from,
		to: to,
		sign: sign
	}

	try {
		const response = await axios.get('http://api.fanyi.baidu.com/api/trans/vip/translate', { params: params })
		return response.data.trans_result[0].dst
	} catch (error) {
		console.error(error);
		return '翻译时出错'
	}
}
export async function fanyiByDeepl(version: string, key: string | undefined, word: string): Promise<string> {
	/**
	 * 使用DeepL 获取翻译结果 https://developers.deepl.com/
	 */
	if (!key) {
		return '请先配置 API Key';
	}

	if (!word) {
		return '翻译内容不能为空';
	}

	const text = participles(word);


	let from = 'EN';
	let to = 'ZH';

	if (isFirstCharEnglish(text)) {
		from = 'EN';
		to = 'ZH';
	} else if (isFirstCharChinese(text)) {
		from = 'ZH';
		to = 'EN';
	}
	let url = 'https://api-free.deepl.com/v2/translate';
	if (version === 'pro') {
		url = 'https://api.deepl.com/v2/translate';
	}
	const headers = {
		'Authorization': `DeepL-Auth-Key ${key}`,
		'Content-Type': 'application/json',
	};
	const data = {
		text: [text],
		source_lang: from,
		target_lang: to
	};

	try {
		const response = await axios.post(url, data, { headers });
		return response.data.translations[0].text
	} catch (error) {
		console.error(error);
		return '翻译时出错'
	}
}
