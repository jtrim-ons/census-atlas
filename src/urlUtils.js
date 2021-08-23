function makeHash(selectCode, active, mapLocation) {
    let lad = active.lad.selected ? active.lad.selected : '';
    let lsoa = active.lsoa.selected ? active.lsoa.selected : '';
    return `#/${selectCode}/${lad}/${lsoa}/${mapLocation.zoom},${mapLocation.lon},${mapLocation.lat}`;
};

export function updateURL(selectCode, active, mapLocation) {
    let hash = location.hash;
    let newhash = makeHash(selectCode, active, mapLocation);
    if (hash != newhash) {
        history.pushState(undefined, undefined, newhash);
    }
}

export function replaceURL(selectCode, active, mapLocation) {
    let hash = makeHash(selectCode, active, mapLocation);
    history.replaceState(undefined, undefined, hash);
}
