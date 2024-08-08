// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


import { fanyiByYoudao, fanyiByBaidu, fanyiByDeepl, showInfo } from './tooltip';



//当您的扩展被激活时，会调用此方法 
//您的扩展在第一次执行命令时被激活
export function activate(context: vscode.ExtensionContext) {
	//使用控制台输出诊断信息（console.log）和错误（console.error） 
	//当您的扩展被激活时，这行代码只会执行一次
	console.log('Congratulations, your extension "translation-for-vscode" is now active!');

	//该命令已在package.json文件中定义 
	//现在使用registerCommand提供命令的实现 
	//commandId参数必须与package.json中的命令字段匹配
	const translate = vscode.commands.registerCommand('translation-for-vscode.translate', async () => {
		const config = vscode.workspace.getConfiguration('translation-for-vscode');

		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);

			const engineChoice = config.get<string>('api-choice');


			switch (engineChoice) {
				case '百度翻译':
					const appid = config.get<string>('baidu.appid', '');
					const key = config.get<string>('baidu.key', '');
					fanyiByBaidu(appid, key, selectedText.toString()).then((txt) => {
						showInfo(txt);
					})
					break;

				case '有道翻译':
					vscode.window.showInformationMessage(`有道翻译暂不支持，请选择其他翻译引擎!`);
					break;

				case 'DeepL(Free)':
					fanyiByDeepl('free', config.get('deepl.key'), selectedText.toString()).then((txt) => {
						showInfo(txt);
					})
					break;
				case 'DeepL(Pro)':
					fanyiByDeepl('pro', config.get('deepl.key'), selectedText.toString()).then((txt) => {
						showInfo(txt);
					})
					break;

				default:
					fanyiByYoudao(selectedText.toString()).then((txt) => {
						showInfo(txt);
					});
					break;
			}
		}
	});

	const convertToKeyValue = vscode.commands.registerCommand('translation-for-vscode.devkit.to-key-value', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);

			// 处理选中的文本
			const newText = selectedText.replace(/^\s*'?(:?.*?)'?:\s*'?(.*?)'?,?$/gm, "'$1': '$2',");

			editor.edit(editBuilder => {
				editBuilder.replace(selection, newText);
			}).then(success => {
				if (success && selectedText !== newText) {
					return vscode.window.showInformationMessage('文本替换成功');
				}
				vscode.window.showErrorMessage('没有可替换的文本');
			});
		}

	})

	context.subscriptions.push(translate);
	context.subscriptions.push(convertToKeyValue);
}

// This method is called when your extension is deactivated
export function deactivate() { }
