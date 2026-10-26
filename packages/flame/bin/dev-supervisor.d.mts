export declare const DEV_RESTART_EXIT_CODE: 75;
export declare const DEV_SUPERVISED_ENV: "FLAME_DEV_SUPERVISED";
export declare const WATCHED_PACKAGES: string[];

export declare function hasWorkspacePackages(fromUrl: string, names?: readonly string[]): boolean;

export declare function superviseDev(
  command: string,
  args: readonly string[],
  options?: { env?: NodeJS.ProcessEnv; onRestart?: () => void }
): Promise<number>;
