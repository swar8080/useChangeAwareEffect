

//length
//has keyof dependencies
//changes.previous['depname']
type ChangeAwareEffectCallback<DEPENDENCIES> = (changes: Changes<DEPENDENCIES>) => (void | (() => void | undefined));

type Changes<DEPENDENCIES> = {
    readonly length: number,
    hasChanged: (dependencyName: keyof DEPENDENCIES) => boolean,
    previous: (dependencyName: keyof DEPENDENCIES) => DEPENDENCIES[keyof DEPENDENCIES]
}

declare function useChangeAwareEffect<DEPENDENCIES>(changeAwareEffect: ChangeAwareEffectCallback<DEPENDENCIES>, dependencies: object);