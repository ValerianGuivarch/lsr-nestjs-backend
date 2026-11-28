// Reusable cooperative scene presets. All coordinates are scene pixels.
// The map asset is private and installed in the Foundry world, not bundled in the repository.
export const RATI_MAP = "worlds/test-pf2/images/scenes/agents-dabsalom/rati.png";
const scale=3;
const point=(x,y)=>[x*scale,y*scale];
const outline=[[98,32],[902,32],[966,101],[966,332],[934,332],[934,500],[966,500],[966,768],[900,835],[900,947],[863,1028],[770,1028],[770,1064],[566,1064],[566,1098],[434,1098],[434,1064],[234,1064],[234,1028],[136,1028],[100,947],[100,835],[33,768],[33,500],[66,500],[66,332],[33,332],[33,101]];
const boundary=outline.map((p,i)=>({c:[...point(...p),...point(...outline[(i+1)%outline.length])],door:0}));
// Movement-only barriers traced from the map's green pipes and central machinery.
// Coordinates use the source image, not token or note positions.
const obstacleLines=[
 [[149,612],[148,541],[155,490],[177,449],[179,418]],
 [[179,395],[161,365],[143,329],[149,302],[176,270],[208,240]],
 [[209,240],[247,207],[283,195],[286,162],[304,150],[381,150]],
 [[381,150],[382,112],[405,78],[421,67]],
 [[421,67],[459,96]],[[580,67],[610,87],[653,101],[700,101],[717,113],[717,225]],
 [[653,101],[624,159],[593,213],[578,236]],
 [[579,236],[550,215]],[[423,236],[451,212]],
 [[790,229],[823,263],[854,288],[870,311],[866,336],[838,370],[818,397]],
 [[818,439],[839,482],[861,520],[864,610]],
 [[279,280],[386,280],[397,543],[371,568],[293,568],[273,536],[279,280]],
 [[462,410],[532,410],[548,583],[535,625],[470,625],[449,584],[462,410]],
 [[616,280],[710,280],[731,537],[708,568],[632,568],[609,536],[616,280]]
];
export const MACHINE_OBSTACLES=obstacleLines.flatMap(line=>line.slice(1).map((p,i)=>({c:[...point(...line[i]),...point(...p)],door:0,move:20,sight:0,light:0,sound:0})));
export const ILLUSTRATED_LAYOUT = {
 name:"Le Ratisseur de tombes — carte",
 src:RATI_MAP,width:3000,height:3408,grid:100,
 manuals:[[266,766],[399,766],[600,766],[733,766],[300,966],[666,966]].map(p=>point(...p)),
 stations:{
  conduits:point(180,416),runes:point(500,548),maze:point(818,416),dial:point(678,471),
  "simon-show":point(365,566),"simon-R":point(350,610),"simon-B":point(383,610),
  "simon-J":point(350,643),"simon-V":point(383,643),pressure:point(751,916)
 },
 walls:[...boundary,...MACHINE_OBSTACLES]
};
