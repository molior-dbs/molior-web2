import {Injectable} from '@angular/core';
import {Subject, Observable, Observer} from 'rxjs';
import {map} from 'rxjs/operators';

import {wsURL} from '../lib/url';

@Injectable()
export class WebsocketService {
    ws: WebSocket;

    constructor() {
        this.ws = null;
    }

    public connect(url): Subject<MessageEvent> {
        return this.create(url);
    }

    private create(url): Subject<MessageEvent> {
        this.ws = new WebSocket(url);

        const observable = Observable.create((obs: Observer<MessageEvent>) => {
            this.ws.onmessage = obs.next.bind(obs);
            this.ws.onerror = obs.error.bind(obs);
            this.ws.onclose = obs.complete.bind(obs);
            return this.ws.close.bind(this.ws);
        });
        const observer = {
            next: (data: object) => {
                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify(data));
                }
            }
        };
        return Subject.create(observer, observable);
    }

    disconnect() {
        this.ws.close();
    }
}

export interface UpdateEvent {
    event: string;
    data: object;
}

export interface Message {
    subject: string;
    event: string;
    data: object;
}

@Injectable()
export class MoliorService {
    public messages: Subject<Message>;
    public wsconnect: Subject<UpdateEvent>;
    public builds: Subject<UpdateEvent>;
    public mirrors: Subject<UpdateEvent>;
    public buildlog: Subject<UpdateEvent>;
    public nodes: Subject<UpdateEvent>;
    connected: boolean;
    outbox: string[];
    up: boolean;

    constructor(private wsService: WebsocketService) {
        this.connected = false;
        this.outbox = [];
        this.wsconnect = new Subject<UpdateEvent>();
        this.builds = new Subject<UpdateEvent>();
        this.mirrors = new Subject<UpdateEvent>();
        this.buildlog = new Subject<UpdateEvent>();
        this.nodes = new Subject<UpdateEvent>();
        this.up = false;

        this.wsconnect.subscribe(msg => {
            if (msg.event === 'connected') {
                console.log('ws: connected');
                this.connected = true;
                this.outbox.forEach( m => {
                    this.send(m);
                });
                this.outbox = [];
            }
        });
    }

    disconnected() {
        if (this.connected) {
            this.connected = false;
            this.wsconnect.next({event: 'disconnected', data: null});
        }
        if (this.up) {
            setTimeout(this.connect.bind(this), 1000);
        }
    }

    error(err) {
        if (this.connected) {
            this.connected = false;
            this.wsconnect.next({event: 'disconnected', data: null});
        }
        if (this.up) {
            setTimeout(this.connect.bind(this), 1000);
        }
    }

    connect() {
        console.log('ws: connecting...');
        this.up = true;
        this.messages = this.wsService.connect(`${wsURL()}/api/websocket`).pipe(map(
            (response: MessageEvent) => {
                const data = JSON.parse(response.data);
                if (data.hasOwnProperty('status')) {
                    if (data.status === 401) {
                        this.wsconnect.next({event: 'unauthorized', data});
                    }
                } else {
                    return this.byname(data);
                }
            }
        )) as Subject<Message>;

        this.messages.subscribe(
            msg => {
                if (!msg) {
                    return;
                }
                if (msg.subject === 'websocket' ) {
                    this.wsconnect.next({event: msg.event, data: msg.data});
                } else if (msg.subject === 'build' ) {
                    this.builds.next({event: msg.event, data: msg.data});
                } else if (msg.subject === 'mirror' ) {
                    this.mirrors.next({event: msg.event, data: msg.data});
                } else if (msg.subject === 'buildlog' ) {
                    this.buildlog.next({event: msg.event, data: msg.data});
                } else if (msg.subject === 'node' ) {
                    this.nodes.next({event: msg.event, data: msg.data});
                } else {
                    console.log('ws', msg);
                }
            },
            (err) => { this.error(err); },
            () => { this.disconnected(); }
        );
    }

   disconnect() {
       this.up = false;
       this.wsService.disconnect();
   }

    send(msg) {
        if (!this.connected) {
            this.outbox.push(msg);
        } else {
            this.messages.next(msg);
        }
    }

    byname(data) {
        const subject = {
            1: 'websocket',
            2: 'eventwatch',
            3: 'userrole',
            4: 'user',
            5: 'project',
            6: 'projectversion',
            7: 'build',
            8: 'buildlog',
            9: 'mirror',
            10: 'node'
        };
        const event = {
            1: 'added',
            2: 'changed',
            3: 'removed',
            4: 'connected',
            5: 'done'
        };
        let info = null;
        if (data.hasOwnProperty('data')) {
            info = data.data;
        }
        return { subject: subject[data.subject], event: event[data.event], data: info };
        // Action
        // add = 1
        // change = 2
        // remove = 3
        // start = 4
        // stop = 5
    }
}
