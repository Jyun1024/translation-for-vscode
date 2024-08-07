import * as vscode from 'vscode';
import axios from 'axios';
import * as crypto from 'crypto';

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

export async function fanyiByYoudao(word: string): Promise<string> {
	if (!word.trim()) return word;
	const wordList = word.trim().split(/(?<=[a-z])(?=[A-Z])|[\-_<>\n]/).map(word => word.toLowerCase());
	// console.log(wordList);
	const words = wordList.filter(item => item.trim() !== '').join(' ');

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


// 函数：获取用户配置的 API Key
export async function getApiKey(): Promise<string | undefined> {
	const config = vscode.workspace.getConfiguration('translation-for-vscode');
	let apiKey = config.get<string>('apiKey');

	if (!apiKey) {
		// 如果未配置 API Key，提示用户输入
		apiKey = await vscode.window.showInputBox({ prompt: '请输入您的 API Key' });
		if (apiKey) {
			// 更新配置
			await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage('API Key 已保存!');
		} else {
			vscode.window.showErrorMessage('API Key 不能为空!');
		}
	}

	return apiKey;
}
