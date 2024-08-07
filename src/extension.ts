// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


import { fanyiByYoudao, showInfo } from './tooltip';



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

			// let position = selection.end;
			// showTooltip(editor, selectedText, position);

			fanyiByYoudao(selectedText.toString()).then((txt) => {
				showInfo(txt);
			});
		}
	});
	const convertToKeyValue = vscode.commands.registerCommand('translation-for-vscode.devkit.to-key-value', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);

			// 处理选中的文本
			const newText = selectedText.replace(/^(:?.*?):\s*(.*?)$/gm, "'$1': '$2',");

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
