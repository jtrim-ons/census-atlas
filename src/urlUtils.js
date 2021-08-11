export function updateURL(selectCode, active, mapLocation) {
    let hash = location.hash;
    let newhash = `#/${selectCode}/${active.lad.selected ? active.lad.selected : ''}/${active.lsoa.selected ? active.lsoa.selected : ''}/${mapLocation.zoom},${mapLocation.lon},${mapLocation.lat}`;
    if (hash != newhash) {
        history.pushState(undefined, undefined, newhash);
    }
}

export function replaceURL(selectCode, active, mapLocation) {
    let hash = `#/${selectCode}/${active.lad.selected ? active.lad.selected : ''}/${active.lsoa.selected ? active.lsoa.selected : ''}/${mapLocation.zoom},${mapLocation.lon},${mapLocation.lat}`;
    history.replaceState(undefined, undefined, hash);
}
