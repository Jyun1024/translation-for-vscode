// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import axios from 'axios';
import * as crypto from 'crypto';

function isFirstCharEnglish(word: string): boolean {
	return /^[A-Za-z]/.test(word[0]);
}

function isFirstCharChinese(word: string): boolean {
	return /^[\u4e00-\u9fff]/.test(word[0]);
}

async function fanyiByYoudao(word: string): Promise<string> {
	if (!word.trim()) return word;
	const wordList = word.trim().split(/(?<=[a-z])(?=[A-Z])|[\-_<>\\n]/).map(word => word.toLowerCase());
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

// 测试示例
// fanyi_by_youdao("Hello").then(console.log);
// fanyi_by_youdao("你好").then(console.log);





function tips(editor: vscode.TextEditor) {
	// 创建一个装饰器类型
	const decorationType = vscode.window.createTextEditorDecorationType({
		after: {
			contentText: ` - 这是一个提示信息`,
			// border: '1px solid gray',
			// backgroundColor: 'yellow',
			// color: 'black',
			margin: '0 0 0 20px'
		}
	});

	// 创建一个范围对象
	const decoration = { range: editor.selection };

	// 设置装饰器
	editor.setDecorations(decorationType, [decoration]);

	// 定时清除装饰器
	setTimeout(() => {
		decorationType.dispose();
	}, 3000);
}


// 函数：获取用户配置的 API Key
async function getApiKey(): Promise<string | undefined> {
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


//当您的扩展被激活时，会调用此方法 
//您的扩展在第一次执行命令时被激活
export function activate(context: vscode.ExtensionContext) {

	//使用控制台输出诊断信息（console.log）和错误（console.error） 
	//当您的扩展被激活时，这行代码只会执行一次
	console.log('Congratulations, your extension "translation-for-vscode" is now active!');

	//该命令已在package.json文件中定义 
	//现在使用registerCommand提供命令的实现 
	//commandId参数必须与package.json中的命令字段匹配
	const disposable = vscode.commands.registerCommand('translation-for-vscode.translate', async () => {

		// const apiKey = await getApiKey();

		// 如果未获取到 API Key，直接返回
		// if (!apiKey) return;

		// 显示用户配置的 API Key
		// vscode.window.showInformationMessage(`当前配置的 API Key 是: ${apiKey}`);

		//您在此处放置的代码将在每次执行命令时执行 
		//向用户显示消息框
		// vscode.window.showInformationMessage('你好，世界!');

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);
			// vscode.window.showInformationMessage(`选中的文本是: ${selectedText}`);
			// tips(editor);
			fanyiByYoudao(selectedText.toString()).then((txt) => {
				vscode.window.showInformationMessage(txt);
			});
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
