export * from './andrew';
export * from './edit-length';
//export * from './export';
export * from './isolation-forest';
//export * from './spider';

export const trim = (str = '') =>
  str
    .replace(/\s+/g, '')
    .replace(/[\n\n]/g, '')
    .replace(/<\/?.+?>/g, '');
