export function read(key,fallback){try{const value=localStorage.getItem(`vanta:${key}`);return value===null?fallback:JSON.parse(value);}catch{return fallback;}}
export function write(key,value){try{localStorage.setItem(`vanta:${key}`,JSON.stringify(value));return true;}catch{return false;}}
export function drop(key){try{localStorage.removeItem(`vanta:${key}`);}catch{}}
