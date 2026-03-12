import { appConfig } from '@g-dx/config';

export interface WorkerBootstrapState {
    appEnv: string;
    queuePrefix: string;
}

export function bootstrapWorker(): WorkerBootstrapState {
    return {
        appEnv: appConfig.app.env,
        queuePrefix: appConfig.queue.prefix,
    };
}

if (process.env.NODE_ENV !== 'test') {
    const state = bootstrapWorker();
    console.info(`[worker] bootstrap ready env=${state.appEnv} queue=${state.queuePrefix}`);
}
