<script>
    import { feature } from 'topojson-client';
	import { onMount } from "svelte";
	import { bbox } from "@turf/turf";
	import { ckmeans } from 'simple-statistics';
	import Panel from "./Panel.svelte";
	import KeyBox from "./KeyBox.svelte";
	import Group from "./Group.svelte";
	import GroupBox from "./GroupBox.svelte";
	import Map from "./Map.svelte";
	import MapSource from "./MapSource.svelte";
	import MapLayer from "./MapLayer.svelte";
	import ColChart from "./charts/Histogram.svelte";
	import SimpleKey from "./charts/SimpleKey.svelte";
	import Loader from "./ui/Loader.svelte";
	import Select from "./ui/Select.svelte";
	import { getData, getNomis, getBreaks, getTopo, processData, setColours, textSearch, addInfoToIndicators } from "./utils.js";
	import { updateURL, replaceURL } from "./urlUtils.js";
	import colors from './colors.js';

	import lad2015topo from "./geogLA2015EW.json";
	let lad2015feature = feature(lad2015topo, lad2015topo.objects.LAD15merc);

	import indicators_ from './indicators.json';
	let indicators = indicators_;
	indicators.forEach(item => addInfoToIndicators(item, 0, null));

	let selectMode = false;
	let indicatorSearchString = "";
	let expandAll = false;  // expand all variable options?

	// CONFIG
	const apiurl = "https://www.nomisweb.co.uk/api/v01/dataset/";
	const apikey = "0x3cfb19ead752b37bb90da0eb3a0fe78baa9fa055";
	const geography = "TYPE298";
	const ladGeography = "TYPE464";
	const mapstyle = "https://bothness.github.io/ons-basemaps/data/style-omt.json";
	const tabledata = "https://bothness.github.io/census-atlas/data/indicators.json";
	const ladtopo = {
		url: "https://bothness.github.io/census-atlas/data/lad_boundaries_2020.json",
		layer: "LA2020EW",
		code: "AREACD",
		name: "AREANM"
	};
	const ladvector = {
		url: "https://cdn.ons.gov.uk/maptiles/administrative/authorities/v1/boundaries/{z}/{x}/{y}.pbf",
		layer: "authority",
		code: "areacd"
	};
	const lsoadata = "https://bothness.github.io/census-atlas/data/lsoa2011_lad2020.csv";

	// OBJECTS
	let map = null;

	// DATA
//	let indicators;
	let ladbounds;
	let ladlookup;
	let ladlist;
	let lsoalookup;
	let data = {};
	let active = {
		lsoa: {
			selected: null,
			geometry: null,
			hovered: null
		},
		lad: {
			selected: null,
			selectedPrev: null,
			hovered: null,
			highlighted: null
		},
	};

	// STATE
	let selectCode = "QS119EW005";
	let mapLocation = null;
    // TODO: remove the following (the default mapLocation should be set somewhere else)
    mapLocation = {
        zoom: 5,
        lon: 2,
        lat: 58
    };

	let selectTable;
	let selectItem;
	let selectMeta;
	let selectData;
	let loading = true;

	let mapLoaded = false;
	let mapZoom = null;

	setIndicator(indicators, selectCode);
	if (!selectTable) {
		selectTable = indicators[0].children[0];
	}

	// FUNCTIONS
	function setIndicator(indicators, code) {
		indicators.forEach(indicator => {
			if (indicator.code && indicator.code == code) {
				selectItem = indicator;
			} else if (indicator.children) {
				setIndicator(indicator.children, code);
			}
		});
	}

    function setDefaultMapLocation(features) {
        // FIXME: this is slow and doesn't set a good zoom level.  Replace it with something better.
        let lon = [Infinity, -Infinity];
        let lat = [Infinity, -Infinity];
        features.forEach(location => {
            let bounds = bbox(location);
            if (bounds[0] < lon[0]) lon[0] = bounds[0];
            if (bounds[2] > lon[1]) lon[1] = bounds[2];
            if (bounds[1] < lat[0]) lat[0] = bounds[1];
            if (bounds[3] > lat[1]) lat[1] = bounds[3];
        });
        mapLocation = {
            zoom: 6,
            lon: +((lon[0] + lon[1]) / 2).toFixed(5),
            lat: +((lat[0] + lat[1]) / 2).toFixed(5)
        };
    }

	function initialise() {
		getTopo(ladtopo.url, ladtopo.layer)
			.then((geo) => {
			    console.log({geo});
				ladbounds = geo;

				let lookup = {};
				let list = [];
				geo.features.forEach((f) => {
					lookup[f.properties[ladtopo.code]] = {
						code: f.properties[ladtopo.code],
						name: f.properties[ladtopo.name]
					};
					list.push(lookup[f.properties[ladtopo.code]]);
				});

				list.sort((a, b) => a.name.localeCompare(b.name));
				ladlist = list;

				if (mapLocation == null) {
                    setDefaultMapLocation(geo.features);
                }
                console.log({mapLocation});

				ladlookup = lookup;

				getData(lsoadata)
					.then((data) => {
						let lookup = {};
						data.forEach((d) => {
							lookup[d.code] = {
								name: d.name,
								parent: d.parent,
							};

							if (!ladlookup[d.parent].children) {
								ladlookup[d.parent].children = [d.code];
							} else {
								ladlookup[d.parent].children.push(d.code);
							}
						});

						lsoalookup = lookup;
					});
			});
	}

	function setSelect() {
		if (!(selectMeta && selectItem && selectMeta.code == selectItem.code)) {
			let code = selectItem.code;
			let group = indicators.find((d) => d.code == code.slice(0, 3));
			let table = group.children.find((d) => d.code == code.slice(0, 7));
			let cell = +code.slice(7, 10);

			selectCode = code;

			selectMeta = {
				code: selectItem.code,
				group: group,
				table: table,
				cell: cell,
			};

			loadData();
			updateURL(selectCode, active, mapLocation);
		}
	}

	function loadData() {
		console.log("loading data...");
		loading = true;
		if (data[selectItem.code]) {
			selectData = data[selectItem.code];
			console.log("data loaded from memory!");
			if (active.lad.selected) {
				setColors();
			}
			loading = false;
		} else {
			// let url = `${apiurl}${selectMeta.table.nomis}${selectMeta.cell}&geography=${geography}&uid=${apikey}`;
			console.log(`${apiurl}${selectMeta.table.nomis}${selectMeta.cell}&geography=${geography}&uid=${apikey}`);
			let ladUrl = `${apiurl}${selectMeta.table.nomis}${selectMeta.cell}&geography=${ladGeography}&uid=${apikey}`;
			let url = `https://bothness.github.io/census-atlas/data/lsoa/${selectMeta.code}.csv`;
			console.log(url);
			///////getNomis(url, selectMeta.cell).then((res) => {
			getNomis(ladUrl, selectMeta.cell).then((res) => {
			    console.log({xyz: res[0]});
				let dataset = {
					lad: {},
					ew: {},
				};
				res.sort((a, b) => a.perc - b.perc);
				dataset.lad.data = res;

				let vals = res.map(d => d.perc);
				let chunks = ckmeans(vals, 5);
				let breaks = getBreaks(chunks);
				dataset.lad.breaks = breaks;

				let proc = processData(res);
				console.log({proc});

				dataset.lad.data = proc.lad.data;
				dataset.lad.index = proc.lad.index;

				dataset.lad.data.forEach((d) => {
					for (let i=0; i<4; i++) {
                        if (d.perc <= dataset.lad.breaks[i + 1]) {
                            setColours(d, i, colors);
                            return;
                        }
                    }
                    setColours(d, 4, colors);
				});

				dataset.ew.data = proc.ew.data;

				data[selectItem.code] = dataset;
				selectData = dataset;
				console.log("data loaded from csv!");
				if (active.lad.selected) {
					setColors();
				}
				loading = false;
			});
		}
	}

	function doSelect() {
		if (active.lad.selected != active.lad.selectedPrev) {
			active.lad.selectedPrev = active.lad.selected;
			if (active.lad.selected && active.lsoa.selected && !ladlookup[active.lad.selected].children.includes(active.lsoa.selected)) {
				active.lsoa.selected = null;
			}
			setColors();
			updateURL(selectCode, active, mapLocation);
		}
	}

	function setColors() {
		let newdata = JSON.parse(JSON.stringify(data[selectItem.code]));
		if (active.lad.selected) {
			// re-color dataset
/////			newdata.lsoa.data.forEach((d) => {
/////				if (lsoalookup[d.code].parent == active.lad.selected) {
/////					d.fill = d.color;
/////					d.selected = true;
/////				} else {
/////					d.fill = d.muted;
/////					d.selected = false;
/////				}
/////			});
			// zoom to district on map
			let geometry = ladbounds.features.find(f => f.properties[ladtopo.code] == active.lad.selected).geometry;
			let bounds = bbox(geometry);
/////			if (!active.lsoa.selected) {
/////				map.fitBounds(bounds, { padding: 20 });
/////			}
		}
		selectData = newdata;
	}

	// CODE
	// Update state based on URL
	let hash = location.hash.split('/');
	if (hash.length == 5) {
		selectCode = hash[1];
		active.lad.selected = hash[2] != '' ? hash[2] : null;
		active.lsoa.selected = hash[3] != '' ? hash[3] : null;
		let zxy = hash[4].split(',');
		mapLocation = {zoom: zxy[0], lon: zxy[1], lat: zxy[2]};
	}

	// Respond to URL change
	window.onpopstate = () => {
		let hash = location.hash.split('/');

		if (selectCode != hash[1]) {
			selectCode = hash[1];
			setIndicator(indicators, selectCode);
		}
		if (active.lsoa.selected != hash[3]) {
			active.lsoa.selected = hash[3] != '' ? hash[3] : null;
		} else if (active.lad.selected != hash[2]) {
			active.lad.selected = hash[2] != '' ? hash[2] : null;
		}
		if (`${mapLocation.zoom},${mapLocation.lon},${mapLocation.lat}` != hash[4]) {
			let loc = hash[4].split(',');
			mapLocation = {zoom: loc[0], center: [loc[1], loc[2]]};
			map.jumpTo(mapLocation);
		}
	}

	$: if (selectTable) { // If selected item isn't in selected table, then select the first item in the table
        let p = selectItem.parent;
        while (p != null && p != selectTable) p = p.parent;
        if (p == null) selectItem = selectTable.children[0];
    }
	$: selectItem && setSelect(); // Update meta when selection updates
	$: active.lad.highlighted = lsoalookup && active.lsoa.hovered ? lsoalookup[active.lsoa.hovered].parent : null;
	$: active.lad.selected = lsoalookup && active.lsoa.selected ? lsoalookup[active.lsoa.selected].parent : active.lad.selected;
	$: (data[selectCode] && (active.lad.selected || active.lad.selected == null)) && doSelect();

	$: if (!mapLoaded && map) {
		mapLoaded = true;

		map.on('moveend', () => {
			let center = map.getCenter();
			mapLocation = {
				zoom: map.getZoom().toFixed(0),
				lon: center.lng.toFixed(5),
				lat: center.lat.toFixed(5)
			};
			replaceURL(selectCode, active, mapLocation);
		});
	}

	onMount(() => initialise());

function updateHiddenProps() {
    if (!indicators) {
        return;
    }
    let numberOfFinds = 0;
    function helper(prop, found) {
        found ||= textSearch(indicatorSearchString, prop.name);
        let found0 = found;
        if ('children' in prop) {
            for (let child of prop.children) {
                found = helper(child, found0) || found;
            }
        }
        if (prop.depth < 2) {
            if (found) ++numberOfFinds;
            prop.hidden = !found;
        }
        return found;
    }
    for (let prop of indicators) {
        helper(prop, false);
    }
    indicators = indicators;
    console.log({numberOfFinds})
    expandAll = numberOfFinds < 15;
}
</script>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
	div {
	    padding-bottom: 8px;
    }
	h1 {
	    color: #999;
		margin-top: 0;
		border-bottom: 3px solid #999;
	}
	hr {
		border: none;
		border-top: 3px solid grey;
	}
	button {
	    background: steelblue;
	    color: white;
	    border-radius: 12px;
	    padding-left: 8px;
	    padding-right: 8px;
    }
	#infobox {
		min-height: 160px;
		padding-bottom: 18px;
	}
	.text-med {
		font-size: 1.5em;
		font-weight: bold;
	}
	.text-lrg {
		font-size: 2em;
		font-weight: bold;
	}
	.grid {
		display: grid;
		grid-gap: 12px;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		justify-items: stretch;
		width: 100%;
		margin: 0;
	}
	.next {
		height: 24px;
		cursor: pointer;
	}
</style>

{#if loading}
	<Loader
		height="100vh"
		width="100vw"
		position="fixed"
		bgcolor="rgba(255, 255, 255, 0.7)" />
{/if}

<Panel {selectMode}>
	<h1>Census Atlas Demo</h1>
	{#if indicators && selectItem}
		<div id="infobox">
			<div>
                <b style="font-size: 2em;">{selectMeta.table.name}</b> <small>({selectMeta.table.code})</small>
                <button on:click="{() => selectMode = true}">Change ➞</button>
			</div>
			<div>
			    The map shows, for each district in England and Wales, the percentage of {selectItem.unit.toLowerCase()}s in the selected category:
			</div>
            <Group
                props={{name: 'abc', isRoot: true, children: selectTable && selectTable.children || []}}
                bind:selected={selectItem}
                searchstring={""}
                expanded
                expandAll={false} />

			<br>
			<!--<div>
			    <strong class="text-med">{selectItem.name}</strong>
			</div> -->
			<div class="grid">
				{#if selectData}
					<div>
						<hr style="border-top-color: #871A5B" />
						<strong>England & Wales</strong><br />
						<strong
							class="text-lrg">{selectData.ew.data.perc.toFixed(1)}%</strong><br />
						<small>{selectData.ew.data.value.toLocaleString()}
							of
							{selectData.ew.data.count.toLocaleString()}
							{selectItem.unit.toLowerCase()}s</small>
					</div>
                    <div>
                        {#if active.lad.hovered || active.lad.highlighted || active.lad.selected}
							<hr style="border-top-color: #F39431" />
							<strong>{active.lad.hovered ? ladlookup[active.lad.hovered].name : active.lad.highlighted ? ladlookup[active.lad.highlighted].name : ladlookup[active.lad.selected].name}</strong><br />
							<strong class="text-lrg">
								{active.lad.hovered ? selectData.lad.index[active.lad.hovered].perc.toFixed(1) : active.lad.highlighted ? selectData.lad.index[active.lad.highlighted].perc.toFixed(1) : selectData.lad.index[active.lad.selected].perc.toFixed(1)}%
							</strong><br />
							<small>{active.lad.hovered ? selectData.lad.index[active.lad.hovered].value.toLocaleString() : active.lad.highlighted ? selectData.lad.index[active.lad.highlighted].value.toLocaleString() : selectData.lad.index[active.lad.selected].value.toLocaleString()}
								of
								{active.lad.hovered ? selectData.lad.index[active.lad.hovered].count.toLocaleString() : active.lad.highlighted ? selectData.lad.index[active.lad.highlighted].count.toLocaleString() : selectData.lad.index[active.lad.selected].count.toLocaleString()}
								{selectItem.unit.toLowerCase()}s</small>
                        {/if}
                    </div>
				{/if}
			</div>
		</div>

		{#if ladlist}
			<Select
				options={ladlist}
				bind:selected={active.lad.selected}
				search={true}
				placeholder="Find a district..."
				on:select={() => active.lsoa.selected = null} />
		{/if}
        <GroupBox>
			<div><button on:click="{() => selectMode = false}">← Go back</button></div>
            <div>
                Select a table from the list below.  To narrow down the list, type part or all of a word in the search box.
            </div>
            <div>
                <input bind:value={indicatorSearchString} on:keyup={updateHiddenProps} placeholder="Search variables">
            </div>
            <Group
                props={{ name: '2011 Census Tables', isRoot: true, children: indicators.slice(0, 8) }}
                bind:selected={selectTable}
                searchstring={indicatorSearchString}
                expanded
                {expandAll} />
        </GroupBox>
	{/if}
</Panel>

{#if mapLocation}
<Map bind:map style={mapstyle} minzoom={4} maxzoom={14} bind:zoom={mapZoom} location={mapLocation}>
    <MapSource
        id="lad2015"
        type="geojson"
        data={lad2015feature}
        promoteId={"AREACD"}>
        <MapLayer
            id="lad2015"
            source="lad2015"
            type="fill"
            data={selectData}
            paint={{
                'fill-opacity': .8,
                'fill-color': ['case',
                    ['!=', ['feature-state', 'color'], null], ['feature-state', 'color'],
                    'rgba(255, 0, 0, 0.1)'
                ]
            }}
            hover={true}
            bind:hovered={active.lad.hovered}
            click={true}
            bind:selected={active.lad.selected}
             />
        <MapLayer
            id="lad2015line"
            source="lad2015"
            type="line"
            highlight={true}
            highlighted={active.lad.highlighted}
            paint={{
                'line-color': 'rgba(255, 255, 255, .5)',
                'line-width': 0.75
            }}
             />
        <MapLayer
            id="lad2015hover"
            source="lad2015"
            type="line"
            highlight={true}
            highlighted={active.lad.highlighted}
            paint={{
                'line-color': ['case',
                    ['==', ['feature-state', 'selected'], true], '#F39431',
                    ['==', ['feature-state', 'hovered'], true], '#F39431',
                    ['==', ['feature-state', 'highlighted'], true], '#F39431',
                    'rgba(255, 255, 255, 0)'
                ],
                'line-width': ['case',
                    ['==', ['feature-state', 'selected'], true], 3,
                    ['==', ['feature-state', 'hovered'], true], 3,
                    ['==', ['feature-state', 'highlighted'], true], 3,
                    0.75
                ]
            }}
             />
    </MapSource>
</Map>
<KeyBox>
    {#if selectData}
        <SimpleKey
            data_="{selectData.lad.data.map(d => d.perc)}"
            breaks={selectData.lad.breaks}
            key="perc" />
    {/if}
</KeyBox>
{/if}
