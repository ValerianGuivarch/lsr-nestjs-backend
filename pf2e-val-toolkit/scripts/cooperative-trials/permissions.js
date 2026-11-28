// Foundry DocumentOwnershipField accepts user IDs/default mapped to numeric
// ownership levels only. Never send deletion keys or null in an ownership diff.
export function privateOwnership(ownership={}){
 return Object.fromEntries([["default",0],...Object.keys(ownership??{}).filter(k=>/^[a-zA-Z0-9]{16}$/.test(k)).map(k=>[k,0])]);
}
export function hasPrivateOwnership(ownership={}){
 return ownership?.default===0&&Object.values(ownership).every(v=>v===0);
}
