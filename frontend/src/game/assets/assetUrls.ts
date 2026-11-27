const assetFiles = import.meta.glob<string>('../../assets/**/*', {
    eager: true,
    query: '?url',
    import: 'default'
});

export function assetUrl(path: string): string | undefined {
    const url = assetFiles[`../../assets/${path}`];
    if (!url) console.warn(`Missing asset: ${path}`);
    return url;
}

export function imageUrl(path: string): string {
    return assetUrl(path) ?? '';
}
