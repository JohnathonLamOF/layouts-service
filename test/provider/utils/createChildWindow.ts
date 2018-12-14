import {Fin, Identity, Window} from 'hadouken-js-adapter';
import {_Window} from 'hadouken-js-adapter/out/types/src/api/window/window';

import {getConnection} from './connect';
import { ChannelClient } from 'hadouken-js-adapter/out/types/src/api/interappbus/channel/client';
import { ExitCode } from 'hadouken-js-adapter/out/types/src/api/system/external-process';
import { execFile } from 'child_process';

let childWindowCount = 1;

const getClientConnection = async () => {
    const fin = await getConnection();
    return fin.InterApplicationBus.Channel.connect('test-app-comms');
};

getConnection().then(fin => {
    fin.System.addListener('window-closed', evt => {
        if (evt.uuid === 'testApp' && evt.name.match(/win\d/)) {
            childWindowCount--;
        }
    });
});

export const createChildWindow = async (windowOptions: fin.WindowOptions, nativeWindow?: boolean) => {
    const fin: Fin = await getConnection();
    const client: ChannelClient = await getClientConnection();
    const windowName: string = 'win' + childWindowCount++;
    const openfinWindowUuid: string = 'testApp';
    

    if (!nativeWindow) {
        await client.dispatch('createWindow', { ...windowOptions, uuid: openfinWindowUuid, name: windowName });
        return fin.Window.wrapSync({ uuid: openfinWindowUuid, name: windowName });;
    } else {
        // Create .NET application with hidden helper app.
        windowOptions.autoShow = false;
        const externalWindowName: string = 'externalWin' + childWindowCount

        const nativeWindow = fin.Window.wrapSync({ uuid: openfinWindowUuid, name: externalWindowName });
        await launchDotNetApp(externalWindowName, openfinWindowUuid);
        
        await sleep(2000);

        await nativeWindow.resizeTo(windowOptions.defaultWidth || 250, windowOptions.defaultHeight || 250, 'bottom-right');

        return nativeWindow;
    }
};

async function launchDotNetApp(externalWindowName: string, nativeWindowHelperAppUuid: string): Promise<Identity> {
    const fin: Fin = await getConnection();
    console.log('preparing to launch dotnet application...');

    //const exec = execFile;

    //exec('D:\\Openfin\\JohnathonLamOF\\layouts-service\\res\\test\\dotnet\\WPF.Test.exe', [`${externalWindowName}`, `${nativeWindowHelperAppUuid}`], (error, data) => {
    //    console.log(error);
    //    console.log(data.toString());
    //});
    //console.log("I have launched the dotnet app")
    const wpfExecutable: string = process.cwd() + '\\res\\test\\dotnet\\WPF.Test.exe';
    console.log(wpfExecutable);

    return await fin.System.launchExternalProcess({
        path: wpfExecutable,
        arguments: `${externalWindowName} ${nativeWindowHelperAppUuid}`,
        listener: (result: ExitCode) => {
            console.log('The exit code', result.exitCode)
        },
    });
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
