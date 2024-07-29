import * as vscode from 'vscode';

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
