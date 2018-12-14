import {Context, GenericTestContext} from 'ava';
import {Window, launch} from 'hadouken-js-adapter';

import {delay} from '../../provider/utils/delay';
import {ArrangementsType, WindowInitializer} from '../../provider/utils/WindowInitializer';
import { TestMacro } from './parameterizedTestUtils';
const execa = require('execa');

const windowOptionsBase = {
    autoShow: true,
    saveWindowState: false,
    defaultHeight: 250,
    defaultWidth: 250,
    url: 'http://localhost:1337/demo/popup.html'
};

export interface CreateWindowData {
    frame: boolean;
    windowCount: number;
    nativeWindowCount?: number;
    arrangement?: string;
}

export interface WindowContext {
    windows: Window[];
    windowInitializer: WindowInitializer;
}

export function createWindowTest<T extends CreateWindowData, C extends WindowContext = WindowContext>(
    testFunc: TestMacro<T, C>, windowOptions?: fin.WindowOptions, customArrangements?: ArrangementsType): TestMacro<T, C> {

    const options: fin.WindowOptions = Object.assign({}, windowOptionsBase, windowOptions);
    const framedInitializer: WindowInitializer = new WindowInitializer(customArrangements, undefined, Object.assign({}, options, {frame: true}));
    const framelessInitializer: WindowInitializer = new WindowInitializer(customArrangements, undefined, Object.assign({}, options, {frame: false}));

    return async (t: GenericTestContext<Context<C>>, data: T) => {
        const {frame, windowCount} = data;

        // Create all windows
        const windowInitializer = frame ? framedInitializer : framelessInitializer;
        const windows: Window[] = await windowInitializer.initWindows(windowCount, data.arrangement, data.nativeWindowCount);
        t.context.windows = windows;
        t.context.windowInitializer = windowInitializer;

        // Delay slightly to allow windows to initialize
        await delay(300);

        try {
            await testFunc(t, data);
        } finally {
            // Close all windows.
            // TODO: Race is called here because close on native windows does not return a promise
            await Promise.all(windows.map(win => Promise.race([win.close(), delay(1000)])));
            // await delay(500);
        }
    };
}

export function cleanup(): void {
    const cmd = 'taskkill /F /IM openfin.exe /T';
    execa.shellSync(cmd);
}