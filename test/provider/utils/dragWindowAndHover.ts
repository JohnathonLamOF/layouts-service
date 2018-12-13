import * as robot from 'robotjs';
import {delay} from './delay';
import {getBounds} from './getBounds';
import {getWindow, Win} from './getWindow';
const xOffset = 30;
const yOffset = 10;

export const dragWindowAndHover = async (identityOrWindow: Win, x: number, y: number) => {
    // Focus the window to make sure it's on top.
    console.log('getting window');
    const win = await getWindow(identityOrWindow);

    console.log('focusing on window');
    await win.focus();

    console.log('I am now getting bounds');
    const bounds = await getBounds(identityOrWindow);
    robot.mouseToggle('up');
    robot.moveMouse(bounds.left + xOffset, bounds.top + yOffset);
    robot.mouseToggle('down');
    robot.moveMouseSmooth(x + xOffset, y + yOffset);

    await delay(500);
};
