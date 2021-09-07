import { feature } from 'topojson-client';
import { csvParse, autoType } from 'd3-dsv';

export async function getData(url) {
  let response = await fetch(url);
  let string = await response.text();
  let data = await csvParse(string, autoType);
  return data;
}

export async function getTopo(url, layer) {
  let response = await fetch(url);
  let topojson = await response.json();
  return feature(topojson, layer);
}

export async function getNomis(url, code) {
  let response = await fetch(url);
  let string = await response.text();
	let tmp = 0;
	let data = csvParse(string, (d) => {
		if (!tmp) {
            console.log(d);
            tmp = 1;
        }
		return {
			code: d['GEOGRAPHY_CODE'],
			value: +d[code],
			count: +d['0'],
			perc: (+d[code] / +d['0']) * 100
		};
	});
  return data;
}

export function processData(data) {
	let lad = {
		data: data,
		index: {}
	};
	let ew = {
		data: {
			value: 0,
			count: 0
		}
	};

	data.forEach(d => {
		lad.index[d.code] = d;
	});

	let keys = Object.keys(lad.index);
	keys.forEach(key => {
		lad.index[key].perc = lad.index[key].value / lad.index[key].count * 100;

		ew.data.value += lad.index[key].value;
		ew.data.count += lad.index[key].count;
	});
	lad.data.sort((a, b) => a.perc - b.perc);

	ew.data.perc = ew.data.value / ew.data.count * 100;

	return {
		lad: lad,
		ew: ew
	};
}

export function getBreaks(chunks) {
	let lastChunk = chunks[chunks.length - 1];
	let breaks = chunks.map(chunk => chunk[0]);
	breaks.push(lastChunk[lastChunk.length - 1]);
	return breaks;
}

export function getThresholds(domain, exp, count = 32) {
	const offset = exp == 1 ? domain[0] : 0;
	const scale = domain[1] - offset;
	const breaks = [offset];
	const brek = 1 / count;
	for (let i = 1; i <= count; i ++) {
		let node = (Math.pow(i * brek, 1 / exp) * scale) + offset;
		if (node > domain[0]) {
			breaks.push(node);
		}
	}
	return breaks;
}

export function setColours(d, i, colours) {
    d.color = colours.base[i];
    d.muted = colours.muted[i];
    d.fill = colours.base[i];
};

// Return true if and only if the target string contains any
// of the tokens in the pattern string.  Case-insensitive
export function textSearch(pattern, target) {
  if (pattern.length === 0) {
    return true;
  }
  for (let token of pattern.split(' ')) {
    if (target.toUpperCase().includes(token.toUpperCase())) {
      return true;
    }
  }
  return false;
}

//// Return true if and only if the pattern string is the target string
//// with some (or no) characters removed.  Case-insensitive
//export function textSearch(pattern, target) {
//  if (pattern.length === 0) {
//    return true;
//  }
//  let j=0;
//  let p = pattern[0].toUpperCase();
//  for (let i=0; i<target.length; i++) {
//    let t = target[i].toUpperCase();
//    if (p === t) {
//      ++j;
//      if (j === pattern.length) {
//        return true;
//      }
//      p = pattern[j].toUpperCase();
//    }  
//  }
//  return false;
//}
