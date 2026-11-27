// Reusable cooperative scene presets. All coordinates are scene pixels.
// The map asset is private and installed in the Foundry world, not bundled in the repository.
export const RATI_MAP = "worlds/test-pf2/images/scenes/agents-dabsalom/rati.png";
const scale=3;
const point=(x,y)=>[x*scale,y*scale];
const outline=[[98,32],[902,32],[966,101],[966,332],[934,332],[934,500],[966,500],[966,768],[900,835],[900,947],[863,1028],[770,1028],[770,1064],[566,1064],[566,1098],[434,1098],[434,1064],[234,1064],[234,1028],[136,1028],[100,947],[100,835],[33,768],[33,500],[66,500],[66,332],[33,332],[33,101]];
const boundary=outline.map((p,i)=>({c:[...point(...p),...point(...outline[(i+1)%outline.length])],door:0}));
export const ILLUSTRATED_LAYOUT = {
 name:"Le Ratisseur de tombes — carte",
 src:RATI_MAP,width:3000,height:3408,grid:100,
 manuals:[[266,766],[399,766],[600,766],[733,766],[300,966],[666,966]].map(p=>point(...p)),
 stations:{
  conduits:point(180,416),runes:point(500,548),maze:point(818,416),dial:point(678,471),
  "simon-show":point(365,566),"simon-R":point(350,610),"simon-B":point(383,610),
  "simon-J":point(350,643),"simon-V":point(383,643),pressure:point(751,916)
 },
 walls:[...boundary,{c:[...point(33,699),...point(466,699)],door:0},{c:[...point(466,699),...point(533,699)],door:1},{c:[...point(533,699),...point(966,699)],door:0}]
};
