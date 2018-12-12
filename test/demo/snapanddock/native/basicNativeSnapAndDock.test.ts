import { test } from 'ava';
import { Fin, Window, Identity } from 'hadouken-js-adapter';

import { getConnection } from '../../../provider/utils/connect';
import { createChildWindow } from '../../../provider/utils/createChildWindow';
import { ExitCode } from 'hadouken-js-adapter/out/types/src/api/system/external-process';
import { dragSideToSide, dragWindowTo } from '../../../provider/utils/dragWindowTo';
import { assertAdjacent, assertGrouped } from '../../../provider/utils/assertions';
import { setTimeout } from 'timers';

let fin: Fin;
let nativeWindowHelperApp: Window;
let openfinWindow: Window;
let dotnetWindow: Window;
let anotherDotnetWindow: Window;

test.before(async () => {
    fin = await getConnection();
});

test.afterEach.always(async () => {
    await openfinWindow.close();
    await dotnetWindow.close();
    await nativeWindowHelperApp.close();
    if (anotherDotnetWindow) {
        await anotherDotnetWindow.close();
    }
});

test('Snap and dock a native dotnet window with openfin window', async (assert) => {
    // Arrange
    const externalWindowName: string = "externalWindowName";

    nativeWindowHelperApp = await createChildWindow({ autoShow: false, name: "helperApp" });

    openfinWindow = await createChildWindow({ autoShow: true, name: 'openfinApp' });

    await launchDotNetApp(externalWindowName, nativeWindowHelperApp.identity.uuid);

    dotnetWindow = fin.Window.wrapSync({ uuid: nativeWindowHelperApp.identity.uuid, name: externalWindowName });

    await sleep(2000);

    await dragSideToSide(openfinWindow, 'left', dotnetWindow, 'right');
    await assertAdjacent(assert, openfinWindow, dotnetWindow, 'left');
    await assertGrouped(assert, openfinWindow, dotnetWindow);

    // Move windows
    await dragWindowTo(openfinWindow, 300, 300);
    await assertAdjacent(assert, openfinWindow, dotnetWindow, 'left');
    await assertGrouped(assert, openfinWindow, dotnetWindow);
});

test('Snap and dock a native dotnet window to another dotnet window', async (assert) => {
    console.log("starting test");
    // Arrange
    const externalWindowNameOne = "externalWindowName";
    const externalWindowNameTwo = "externalWindowName2";

    nativeWindowHelperApp = await createChildWindow({ autoShow: false, name: "helperApp" });
    console.log("creating dot net apps");
    await launchDotNetApp(externalWindowNameOne, nativeWindowHelperApp.identity.uuid),
    await launchDotNetApp(externalWindowNameTwo, nativeWindowHelperApp.identity.uuid)

    dotnetWindow = fin.Window.wrapSync({ uuid: nativeWindowHelperApp.identity.uuid, name: externalWindowNameOne });
    anotherDotnetWindow = fin.Window.wrapSync({ uuid: nativeWindowHelperApp.identity.uuid, name: externalWindowNameTwo });

    await sleep(2000);

    await dragSideToSide(anotherDotnetWindow, 'left', dotnetWindow, 'right');
    await assertAdjacent(assert, anotherDotnetWindow, dotnetWindow, 'left');
    await assertGrouped(assert, anotherDotnetWindow, dotnetWindow);

    // Move windows
    await dragWindowTo(anotherDotnetWindow, 300, 300);
    await assertAdjacent(assert, anotherDotnetWindow, dotnetWindow, 'left');
    await assertGrouped(assert, anotherDotnetWindow, dotnetWindow);
});


function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function launchDotNetApp(externalWindowName: string, nativeWindowHelperAppUuid: string): Promise<Identity> {
    return await fin.System.launchExternalProcess({
        path: 'D:\\Openfin\\JohnathonLamOF\\layouts-service\\res\\test\\dotnet\\WPF.Test.exe',
        arguments: `${externalWindowName} ${nativeWindowHelperAppUuid}`,
        listener: (result: ExitCode) => {
            console.log('The exit code', result.exitCode)
        },
    });
}