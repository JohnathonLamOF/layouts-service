/*tslint:disable:no-any*/

import * as Mousetrap from 'mousetrap';

import {createClientPromise, exportClientFunction, ServiceClient, ServiceIdentity} from './util';

const VERSION = '0.0.1';

declare var fin: any;
if (typeof fin === 'undefined') {
    throw new Error('fin is not defined, This module is only intended for use in an OpenFin application.');
}

const getId = (() => {
    let id: ServiceIdentity;
    return () => {
        if (id) {
            return id;
        }
        const {uuid, name} = fin.desktop.Window.getCurrent();
        id = {uuid, name};
        return id;
    };
})();

const clientP = createClientPromise({uuid: 'Layouts-Manager', name: 'Layouts-Manager'}, VERSION);



clientP.then(client => {
    Mousetrap.bind('mod+shift+u', () => {
        client.dispatch('undock', getId());
        console.log('Window un-docked via keyboard shortcut');
    });
});

export const undock = exportClientFunction(clientP, (client: ServiceClient) => async (identity: ServiceIdentity = getId()) => {
                          await client.dispatch('undock', identity);
                      }) as (identity?: ServiceIdentity) => Promise<void>;

export const deregister = exportClientFunction(clientP, (client: ServiceClient) => async (identity: ServiceIdentity = getId()) => {
                              await client.dispatch('deregister', identity);
                          }) as (identity?: ServiceIdentity) => Promise<void>;

export const explodeGroup = exportClientFunction(clientP, (client: ServiceClient) => async (identity: ServiceIdentity = getId()) => {
                                await client.dispatch('explode', identity);
                            }) as (identity?: ServiceIdentity) => Promise<void>;


export enum GroupEventType {
    joingroup,
    leavegroup
}

/**
 * Registers an event listener for grouping events
 * @param {GroupEventType} eventType Event to be subscribed to. Valid options are 'joingroup' and 'leavegroup'
 * @param {() => void} callback Function to be executed on event firing. Takes no arguments and returns void.
 */
export async function addEventListener(eventType: GroupEventType, callback: () => void): Promise<void> {
    const client = await clientP;

    client.register(eventType.toString(), () => {
        callback();
    });
}