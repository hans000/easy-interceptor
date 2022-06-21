import require from '../utils/require'

export function importMinimatch() {
    return new Promise((resolve, reject) => {
        require.register({
            name: 'balanced-match',
            path: 'https://unpkg.com/balanced-match@2.0.0/index.js',
        })
        require.register({
            name: 'brace-expansion',
            path: 'https://unpkg.com/brace-expansion@2.0.1/index.js',
        })
        require.register({
            name: 'minimatch',
            path: 'https://unpkg.com/minimatch@3.1.2/minimatch.js',
            var: 'minimatch',
        }).then(resolve).catch(reject)
    })
}