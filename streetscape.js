//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

var footway_color = '#888';
var cycleway_color = '#833';
var planting_color = '#473';
var soil_color = '#444';
var tarmac_color = '#333';
var buslane_color = '#844';
var arrow_color = '#fff';
var text_color = '#fff';
var bark_color = '#543';
var car_color = '#ddd';
var window_color = '#225';

var arrow_alpha = 0.3;
var text_alpha = 0.75;

var sky_top_color = '#84A3B0';
var sky_bottom_color = '#A4C3D0';

// how high is the ground above the bottom of the screen
// how high are the details are above the ground
var ground_depth = 100;
var detail_height = 50 * 8;

// the current street_layout index the mouse is pointing to

var current_element = undefined;
var to_left_of_current_element = false;

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

var type_information = {
	'foot': {
		label: 'Footway',
		short_label: 'Foot',
		background: footway_color,
		directional: false,
		turning: false,
		raising: true,
		min_width: 1.0,
		max_width: 10.0,
	},
	'cycle': {
		label: 'Cycle Lane',
		short_label: 'Cycle',
		background: cycleway_color,
		directional: true,
		turning: false,
		raising: true,
		min_width: 1.5,
		max_width: 4.0,
	},
	'tree': {
		label: 'Planting',
		short_label: 'Plant',
		background: planting_color,
		directional: false,
		turning: false,
		min_width: 1.0,
		max_width: 6.0,
	},
	'grass': {
		label: 'Grass',
		short_label: 'Grass',
		background: planting_color,
		directional: false,
		turning: false,
		min_width: 0.3,
		max_width: 16.0,
	},
	'unallocated': {
		label: 'Unallocated',
		short_label: '',
		background: soil_color,
		directional: false,
		turning: false,
		min_width: 0.3,
		max_width: 16.0,
	},
	'refuge': {
		label: 'Refuge',
		short_label: '',
		background: footway_color,
		directional: false,
		turning: false,
		raising: true,
		min_width: 0.3,
		max_width: 8.0,
	},
	'traffic': {
		label: 'General Traffic',
		short_label: 'Traffic',
		background: tarmac_color,
		directional: true,
		turning: false,
		min_width: 2.0,
		max_width: 4.5,
	},
	'parking': {
		label: 'Parking',
		short_label: 'Park',
		background: tarmac_color,
		directional: true,
		turning: false,
		min_width: 2.0,
		max_width: 4.5,
	},
	'cycleparking': {
		label: 'Cycle Parking',
		short_label: 'Park',
		background: footway_color,
		directional: false,
		turning: true,
		raising: true,
		min_width: 1.0,
		max_width: 2.0,
	},
	'turn': {
		label: 'Turning Lane',
		short_label: 'Turn',
		background: tarmac_color,
		directional: true,
		turning: true,
		min_width: 2.0,
		max_width: 4.5,
	},
	'bus': {
		label: 'Bus Lane',
		short_label: 'Bus',
		background: buslane_color,
		directional: true,
		raising: true,
		turning: false,
		min_width: 2.6,
		max_width: 4.5,
	},
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

var street_layout = [
	{ type: 'foot', width: 2.0, seed: 0.5333517442923039, raised: true },
	{ type: 'cycle', width: 2.5, direction: 'up', raised: true },
	{ type: 'tree', width: 2.3 },
	{ type: 'traffic', width: 3.2, direction: 'up' },
	{ type: 'traffic', width: 3.2, direction: 'down' },
	{ type: 'tree', width: 2.3 },
	{ type: 'cycle', width: 2.5, direction: 'down', raised: true },
	{ type: 'foot', width: 2.0, seed: 0.9944968002382666, raised: true},
];

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

var tile1_image = undefined;
var tile2_image = undefined;
var base_cycle_image = undefined;
var base_person_image = undefined;

var tiles_to_load = 0;

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

var seed = 0;

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function get_random_seed ()
{
	return seed;
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function set_random_seed (new_seed)
{
	seed = new_seed;
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function random ()
{
	seed = Math.floor (1103515245 * seed + 12345) % (65536 * 65536);
	return seed % 65536.0 / 65536.0;
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function get_random_color ()
{
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';

	for (var i = 0; i < 6; i++ )
	{
	color += letters [Math.floor (random () * 16)];
	}

	return color;
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
////
//// Draw Sky
////
//// Draws the sky, including the graduated background
////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_sky (canvas, context)
{
	var gradient = context.createLinearGradient (
		0, 0, 0, canvas.height - ground_depth
	);
	gradient.addColorStop (0, sky_top_color);
	gradient.addColorStop (1, sky_bottom_color);

	context.beginPath ();
	context.rect (0, 0, canvas.width, canvas.height - ground_depth);
	context.fillStyle = gradient;
	context.fill ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
////
//// Draw Ground
////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_ground (canvas, context)
{
	context.beginPath ();
	context.rect (
		0, canvas.height - ground_depth,
		canvas.width, canvas.height
	);
	context.fillStyle = soil_color;
	context.fill ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_centred_text (context, width, y, text, short_text)
{
	var text_width = context.measureText (text);
	var x = (width - text_width.width) / 2.0;

	if (text_width.width <= width - 4.0)
	{
		context.fillText (text, x, y);
	}
	else
	{
		if (short_text != undefined)
		{
			text_width = context.measureText (short_text);
			x = (width - text_width.width) / 2.0;

			if (text_width.width <= width - 2.0)
			{
				context.fillText (short_text, x, y);
			}
		}
		else
		{
			context.fillText (text, x, y);
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_arrow (context, x1, y1, x2, y2)
{
	var cx = (x1 + x2) / 2.0;
	var cy = (y1 + y2) / 2.0;
	var dy = (y1 - y2) / (y1 + y2);

	context.globalAlpha = arrow_alpha;

	context.beginPath ();
	context.lineWidth = 6;
	context.moveTo (cx, cy - 16 * dy);
	context.lineTo (cx, cy + 3 * dy);
	context.strokeStyle = context.fillStyle;
	context.stroke ();
	context.beginPath ();
	context.moveTo (cx + 9, cy + 3 * dy);
	context.lineTo (cx, cy + 16 * dy);
	context.lineTo (cx - 9, cy + 3 * dy);
	context.fill ();

	context.globalAlpha = 1.0;
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_left_arrow (context, x1, y1, x2, y2)
{
	var cx = (x1 + x2) / 2.0;
	var cy = (y1 + y2) / 2.0;
	var dy = (y1 - y2) / (y1 + y2);

	context.globalAlpha = arrow_alpha;

	context.beginPath ();
	context.lineWidth = 6;
	context.moveTo (cx, cy - 16 * dy);
	context.quadraticCurveTo (cx, cy + 3 * dy, cx - 8, cy + 3 * dy);
	context.strokeStyle = context.fillStyle;
	context.stroke ();
	context.beginPath ();
	context.moveTo (cx - 8, cy + 12 * dy);
	context.lineTo (cx - 21, cy + 3 * dy);
	context.lineTo (cx - 8, cy - 6 * dy);
	context.fill ();

	context.globalAlpha = 1.0;
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_right_arrow (context, x1, y1, x2, y2)
{
	var cx = (x1 + x2) / 2.0;
	var cy = (y1 + y2) / 2.0;
	var dy = (y1 - y2) / (y1 + y2);

	context.globalAlpha = arrow_alpha;

	context.beginPath ();
	context.lineWidth = 6;
	context.moveTo (cx, cy - 16 * dy);
	context.quadraticCurveTo (cx, cy + 3 * dy, cx + 8, cy + 3 * dy);
	context.strokeStyle = context.fillStyle;
	context.stroke ();
	context.beginPath ();
	context.moveTo (cx + 8, cy + 12 * dy);
	context.lineTo (cx + 21, cy + 3 * dy);
	context.lineTo (cx + 8, cy - 6 * dy);
	context.fill ();

	context.globalAlpha = 1.0;
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_footway (context, width, raised)
{
	var height;

	if (raised)
	{
		height = 12;
	}
	else
	{
		height = 4;
	}

	context.beginPath ();
	context.rect (0, 0, width, height);
	context.fillStyle = footway_color;
	context.fill ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_cycleway (context, width, raised)
{
	var height;

	if (raised)
	{
		height = 8;
	}
	else
	{
		height = 4;
	}

	context.beginPath ();
	context.rect (0, 0, width, height);
	context.fillStyle = cycleway_color;
	context.fill ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_tree (context, width)
{
	var cx = width / 2.0;

	context.scale (1, -1);
	context.drawImage (
		tile1_image,
		40*24, 56*24,
		9*24, 21*24,
		cx - 1.5 * 50, -7 * 50,
		3 * 50, 7 * 50
	);
	context.scale (1, -1);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_people (context, width, raised)
{

	var cx = width / 2.0;
	var y = 0;

	if (raised)
	{
		y = -2.5 * 50;
	}
	else
	{
		y = -2.5 * 50 + 8;
	}

	var person = Math.floor (random () * 31);

	draw_specific_person(context, width, person, cx - 0.75 * 50, y);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_specific_person(context, width, person, x, y)
{
	var tilex = person % 10;
	var tiley = Math.floor (person / 10);

	context.scale (1, -1);
	context.drawImage (
		tile2_image,
		tilex*5*24, (74+tiley*8)*24,
		5*24, 8*24,
		x, y,
		1.5 * 50, 2.67 * 50
	);
	context.scale (1, -1);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

var CHILD_BIKE=1;
var ADULT_BIKE=3;
var TRICYCLE=5;

var person_row_per_cycle_row = { 1: 0, 3: 1, 5: 1 };
var num_people_per_row = { 0: 4, 1: 10 };
var num_cycles_per_row = { 1: 2, 3: 2, 5: 2 };

var cycle_choices = [
	[TRICYCLE, CHILD_BIKE, CHILD_BIKE],
	[TRICYCLE, CHILD_BIKE, ADULT_BIKE],
	[TRICYCLE, ADULT_BIKE, CHILD_BIKE],
	[ADULT_BIKE, ADULT_BIKE, CHILD_BIKE],
	[CHILD_BIKE, ADULT_BIKE, CHILD_BIKE]
];

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_specific_cycle (context, direction, cycle_row, cycle_col, person_row, person_col, x, y)
{
	var sf = 0.6;
	var px = x;
	var cx = x;

	if (direction == 'up')
	{
		context.drawImage (
			base_cycle_image,
			(cycle_col+1)*100, cycle_row*150,
			100, 150,
			cx, y,
			sf * 100, sf * 150
		);
		context.drawImage (
			base_person_image,
			(person_col+1)*100, person_row*200,
			100, 200,
			px, y - 50 * sf,
			sf * 100, sf * 200
		);
		context.drawImage (
			base_cycle_image,
			(cycle_col+1)*100, (cycle_row+1)*150,
			100, 150,
			cx, y,
			sf * 100, sf * 150
		);
	}
	else
	{
		context.drawImage (
			base_cycle_image, cycle_col*100, cycle_row*150,
			100, 150,
			cx, y,
			sf * 100, sf * 150
		);
		context.drawImage (
			base_person_image,
			person_col*100, person_row*200,
			100, 200,
			px, y - 50 * sf,
			sf * 100, sf * 200
		);
		context.drawImage (
			base_cycle_image,
			cycle_col*100, (cycle_row+1)*150,
			100, 150,
			cx, y,
			sf * 100, sf * 150
		);
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_cycle (context, direction, cycle_row, x, y)
{
	var person_row = person_row_per_cycle_row[cycle_row];
	var person_col = 2*(Math.floor(random() * num_people_per_row[person_row]));
	var cycle_col =  2*(Math.floor(random() * num_cycles_per_row[cycle_row]));

	draw_specific_cycle (
		context, direction,
		cycle_row, cycle_col,
		person_row, person_col,
		x, y
	);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_bicycles (context, width, raised, direction)
{
	//var cx = width / 2.0;
	var num_bikes = 1;

	if (width < 2.1 * 50)
	{
		num_bikes = 1;
	}
	else if (width < 3.5 * 50)
	{
		num_bikes = 2;
	}
	else
	{
		num_bikes = 3;
	}

	context.scale (1, -1);

	var gap = (width - num_bikes * 50) / (num_bikes + 1);
	var x = gap;
	var y = 0;

	if (raised)
	{
		y = -1.85 * 50 - 4;
	}
	else
	{
		y = -1.85 * 50;
	}

	var choice = Math.floor(random() * cycle_choices.length);

	for (var i = 0; i < num_bikes; i ++)
	{
		draw_cycle(context, direction, cycle_choices[choice][i], x, y);
		x += 50 + gap;
	}

	context.scale (1, -1);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_car (context, width, direction)
{
	var cx = width / 2.0;

	context.scale (1, -1);

	if (direction == 'up')
	{
		context.drawImage (
			tile1_image,
			0*24, 32*24,
			8*24, 8*24,
			cx - 1.25 * 50, -2.05 * 50,
			2.5 * 50, 2.5 * 50
		);
	}
	else
	{
		context.drawImage (tile1_image,
			8*24, 32*24,
			8*24, 8*24,
			cx - 1.25 * 50, -2.05 * 50,
			2.5 * 50, 2.5 * 50
		);
	}

	context.scale (1, -1);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_parked_bicycle (context, width, raised, turn)
{
	var cx = width / 2.0;
	var y;

	if (turn == 'left')
	{
		cx = 1.3 * 50;
	}
	else
	{
		cx = width - 0.7 * 50;
	}

	if (raised)
	{
		y = -1.87 * 50 - 8;
	}
	else
	{
		y = -1.87 * 50;
	}

	context.scale (1, -1);

	if (turn == 'left')
	{
		context.drawImage (
			tile1_image,
			67*24, 2*24,
			6*24, 6*24,
			cx - 1.25 * 50, y,
			1.875 * 50, 1.875 * 50
		);
	}
	else
	{
		context.drawImage (
			tile1_image,
			61*24, 2*24,
			6*24, 6*24,
			cx - 1.25 * 50, y,
			1.875 * 50, 1.875 * 50
		);
	}

	context.scale (1, -1);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_parked_car (context, width, direction)
{
	var cx = width / 2.0;

	if (direction == 'up')
	{
		cx = 1.05 * 50;
	}
	else
	{
		cx = width - 1.05 * 50;
	}

	context.scale (1, -1);

	if (direction == 'up')
	{
		context.drawImage (
			tile1_image,
			0*24, 32*24,
			8*24, 8*24,
			cx - 1.25 * 50, -2.05 * 50,
			2.5 * 50, 2.5 * 50
		);
	}
	else
	{
		context.drawImage (
			tile1_image,
			8*24, 32*24,
			8*24, 8*24,
			cx - 1.25 * 50, -2.05 * 50,
			2.5 * 50, 2.5 * 50
		);
	}
	context.scale (1, -1);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_bus (context, width, raised, direction)
{
	var cx = width / 2.0;

	var y;

	if (raised)
	{
		y = -2.9 * 50 - 4;
	}
	else
	{
		y = -2.9 * 50;
	}

	context.scale (1, -1);

	if (direction == 'up')
	{
		context.drawImage (
			tile1_image,
			16*24, 28*24,
			11*24, 11*24,
			cx - 1.5 * 50 - 6, y,
			3 * 50, 3 * 50
		);
	}
	else
	{
		context.drawImage (tile1_image,
			28*24, 28*24,
			11*24, 11*24,
			cx - 1.5 * 50, y,
			3 * 50, 3 * 50
		);
	}

	context.scale (1, -1);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_grass (context, width)
{
	var height = 6 + 4;

	context.beginPath ();
	context.rect (0, 0, width, height);
	context.fillStyle = planting_color;
	context.fill ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_unallocated (context, width)
{
	var height = 0;

	context.beginPath ();
	context.rect (0, 0, width, height);
	context.fillStyle = soil_color;
	context.fill ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_refuge (context, width, raised)
{
	var height = 4;

	if (raised)
	{
		height += 8;
	}

	context.beginPath ();
	context.rect (0, 0, width, height);
	context.fillStyle = footway_color;
	context.fill ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_road (context, width)
{
var height = 4;

context.beginPath ();
context.rect (0, 0, width, height);
context.fillStyle = tarmac_color;
context.fill ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_bus_road (context, width, raised)
{
	var height = 4;

	if (raised)
	{
		height += 4;
	}

	context.beginPath ();
	context.rect (0, 0, width, height);
	context.fillStyle = buslane_color;
	context.fill ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_street_element (canvas, context, element, height)
{
	var type_info = type_information[element.type];
	var old_seed;

	if (element.seed != undefined)
	{
		old_seed = get_random_seed ();
		set_random_seed (element.seed);
	}

	switch (element.type)
	{
		case 'foot':
		{
			draw_footway (context, element.width * 50, element.raised);
			draw_people (context, element.width * 50, element.raised);
			break;
		}

		case 'cycle':
		{
			draw_cycleway (context, element.width * 50, element.raised);
			draw_bicycles (context,
				element.width * 50,
				element.raised,
				element.direction
			);
			break;
		}

		case 'tree':
		{
			draw_tree (context, element.width * 50);
			draw_grass (context, element.width * 50);
			break;
		}

		case 'grass':
		{
			draw_grass (context, element.width * 50);
			break;
		}

		case 'unallocated':
		{
			draw_unallocated (context, element.width * 50);
			break;
		}

		case 'refuge':
		{
			draw_refuge (context, element.width * 50, element.raised);
			break;
		}

		case 'parking':
		{
			draw_road (context, element.width * 50);
			draw_parked_car (context, element.width * 50, element.direction);
			break;
		}

		case 'cycleparking':
		{
			draw_footway (context, element.width * 50, element.raised);
			draw_parked_bicycle (
				context,
				element.width * 50,
				element.raised,
				element.turn
			);
			break;
		}

		case 'traffic':
		{
			draw_road (context, element.width * 50);
			draw_car (context, element.width * 50, element.direction);
			break;
		}

		case 'turn':
		{
			draw_road (context, element.width * 50);
			draw_car (context, element.width * 50, element.direction);
			break;
		}

		case 'bus':
		{
			draw_bus_road (context, element.width * 50, element.raised);
			draw_bus (
				context,
				element.width * 50,
				element.raised,
				element.direction
			);
			break;
		}

		default:
		{
			context.beginPath ();
			context.rect (0, 0, canvas.width, canvas.height);
			context.fillStyle = get_random_color ();
			context.fill ();
			break;
		}
	}

	if (element.seed != undefined)
	{
		set_random_seed (old_seed);
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_street_element_label
(
	canvas,
	context,
	element,
	height,
	highlight
)
{
	var type_info = type_information[element.type];

	var label = type_info.label;
	var short_label  = type_info.short_label;

	if (highlight)
	{
		context.beginPath ();
		context.rect (1, height / 2.0 + 1, element.width * 50 - 2, height);
		context.fillStyle = '#999';
		context.fill ();
	}
	else
	{
		context.beginPath ();
		context.rect (1, height / 2.0 + 1, element.width * 50 - 2, height);
		context.fillStyle = '#777';
		context.fill ();
	}

	context.beginPath ();
	context.rect (0, 0, element.width * 50, height / 2.0 - 1);
	context.fillStyle = type_info.background;
	context.fill ();

	if (type_info.directional)
	{
		if (type_info.turning)
		{
			if (element.turn == 'left')
			{
				if (element.direction == 'up')
				{
					context.fillStyle = arrow_color;
					draw_left_arrow
					(
						context, 0, 0,
						element.width * 50, height / 2.0
					);
				}
				else if (element.direction == 'down')
				{
					context.fillStyle = arrow_color;
					draw_left_arrow
					(
						context, 0, height / 2.0,
						element.width * 50, 0
					);
				}
			}
			else if (element.turn == 'right')
			{
				if (element.direction == 'up')
				{
					context.fillStyle = arrow_color;
					draw_right_arrow
					(
						context, 0, 0,
						element.width * 50, height / 2.0
					);
				}
				else if (element.direction == 'down')
				{
					context.fillStyle = arrow_color;
					draw_right_arrow
					(
						context, 0, height / 2.0,
						element.width * 50, 0
					);
				}
			}
		}
		else
		{
			if (element.direction == 'up')
			{
				context.fillStyle = arrow_color;
				draw_arrow (context, 0, 0, element.width * 50, height / 2.0);
			}
			else if (element.direction == 'down')
			{
				context.fillStyle = arrow_color;
				draw_arrow (context, 0, height / 2.0, element.width * 50, 0);
			}
		}
	}

	context.fillStyle = text_color;

	context.globalAlpha = text_alpha;

	context.save ();
	context.beginPath ();
	context.rect (1, 1, element.width * 50 - 2, ground_depth - 2);
	context.clip ();

	context.font = '14pt Helvetica';
	draw_centred_text
	(
		context,
		element.width * 50, height / 2.0 + 20,
		label, short_label
	);

	context.font = '12pt Helvetica';
	draw_centred_text
	(
		context,
		element.width * 50, height / 2.0 + 40,
		element.width + 'm', element.width
	);

	context.restore ();

	context.globalAlpha = 1.0;
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function determine_current_element_from_x (canvas, position_x)
{
	var total_width = 0.0;

	for (var i = 0; i < street_layout.length; i ++)
	{
		total_width += street_layout[i].width;
	}

	var width = 50 * total_width;
	var centre = canvas.width / 2.0;

	var x = centre - width / 2.0;

	current_element = undefined;

	if (position_x >= x)
	{
		for (var i = 0; i < street_layout.length; i ++)
		{
			if (position_x < x + street_layout[i].width * 50.0)
			{
				current_element = i;

				if (position_x < x + street_layout[i].width * 50.0 / 2.0)
				{
					to_left_of_current_element = true;
				}
				else
				{
					to_left_of_current_element = false;
				}

				break;
			}

			x += street_layout[i].width * 50.0;
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_layout (canvas, context)
{
	var total_width = 0.0;

	for (var i = 0; i < street_layout.length; i ++)
	{
		total_width += street_layout[i].width;

		if (street_layout[i].seed == undefined)
		{
			street_layout[i].seed = Math.random ();
		}
	}

	var width = 50 * total_width;
	var centre = canvas.width / 2.0;

	var x = centre - width / 2.0;

	for (var i = 0; i < street_layout.length; i ++)
	{
		context.translate (x, canvas.height - ground_depth);

		draw_street_element_label
		(
			canvas,
			context,
			street_layout[i],
			ground_depth,
			current_element == i
		);

		context.setTransform(1, 0, 0, 1, 0, 0);

		x += street_layout[i].width * 50.0;
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_surface (canvas, context)
{
	var total_width = 0.0;

	for (var i = 0; i < street_layout.length; i ++)
	{
		total_width += street_layout[i].width;
	}

	var width = 50 * total_width;
	var centre = canvas.width / 2.0;

	var x = centre - width / 2.0;

	for (var i = 0; i < street_layout.length; i ++)
	{
		context.translate (x, canvas.height - ground_depth);
		context.scale (1.0, -1.0);

		draw_street_element (canvas, context, street_layout[i], ground_depth);

		context.setTransform(1, 0, 0, 1, 0, 0);

		x += street_layout[i].width * 50.0;
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function draw_canvas (canvas, context)
{
	draw_sky (canvas, context);
	draw_ground (canvas, context);
	draw_layout (canvas, context);
	draw_surface (canvas, context);

	update_location_hash ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function update_location_hash ()
{
	var design = '#';
	var element_codings = {
		'foot': 'F',
		'cycle': 'C',
		'tree': 'T',
		'grass': 'A',
		'unallocated': 'Y',
		'refuge': 'E',
		'parking': 'P',
		'cycleparking': 'S',
		'traffic': 'G',
		'turn': 'U',
		'bus': 'B',
	};

	for (var i = 0; i < street_layout.length; i ++)
	{
		var element = street_layout[i];
		var type_info = type_information[element.type];

		if (i > 0)
		{
			design += ',';
		}

		design += element_codings[element.type];
		var numstr = Math.floor (element.width * 10) + '';

		if (numstr.length == 1)
		{
			numstr = '0' + numstr;
		}
		design += numstr;

		if (type_info.raising)
		{
			if (element.raised)
			{
				design += 'r';
			}
			else
			{
				design += 'n';
			}
		}
		else
		{
			design += '_';
		}

		if (type_info.directional)
		{
			if (element.direction == 'up')
			{
				design += 'u';
			}
			else
			{
				design += 'd';
			}
		}
		else
		{
			design += '_';
		}

		if (type_info.turning)
		{
			if (element.turn == 'left')
			{
				design += 'l';
			}
			else
			{
				design += 'r';
			}
		}
		else
		{
			design += '_';
		}
	}

	location.hash = design;
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function parse_location_hash (hash)
{
	var i;
	var parts = hash.substr(1).split(',');

	var element_codings = {
		'F': 'foot',
		'C': 'cycle',
		'T': 'tree',
		'A': 'grass',
		'Y': 'unallocated',
		'E': 'refuge',
		'P': 'parking',
		'S': 'cycleparking',
		'G': 'traffic',
		'U': 'turn',
		'B': 'bus',
	};

	street_layout = [];

	for (i = 0; i < parts.length; i ++)
	{
		var part = parts[i];

		var type = part[0];
		var width = part.substr(1,2);
		var raised = part[3];
		var direction = part[4];
		var turn = part[5];

		street_layout.push ({});

		street_layout[i].type = element_codings[type];
		street_layout[i].width = width / 10.0;
		if (raised == 'r')
		{
			street_layout[i].raised = true;
		}
		else
		{
			street_layout[i].raised = false;
		}

		if (direction == 'u')
		{
			street_layout[i].direction = 'up';
		}
		else
		{
			street_layout[i].direction = 'down';
		}

		if (turn == 'l')
		{
			street_layout[i].turn = 'left';
		}
		else
		{
			street_layout[i].turn = 'right';
		}

		console.log (type, width, raised, direction, turn);
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function redraw_canvas ()
{
	var canvas = document.getElementById ('streetscape_canvas');
	var context = canvas.getContext ('2d');
	globalContext = context;
	draw_canvas (canvas, context);
}

var globalContext;

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function on_canvas_resize ()
{
	var canvas = document.getElementById ('streetscape_canvas');
	var context = canvas.getContext ('2d');
	var streetscape_width = document.getElementById ('streetscape_width');

	var total_width = 0.0;

	for (var i = 0; i < street_layout.length; i ++)
	{
		total_width += street_layout[i].width;
	}

	total_width = Math.floor (total_width * 10.01) / 10.0;

	streetscape_width.innerHTML =
		"<span style=\"line-height: 50px;\"></span>Width : " +
		total_width + "m"

	if (50 * total_width > document.documentElement.clientWidth)
	{
		canvas.style.marginLeft = "0px";
	}
	else
	{
		canvas.style.marginLeft =
			(document.documentElement.clientWidth - 50 * total_width) / 2.0 +
			"px";
	}

	canvas.style.width = 50 * total_width + "px";
	canvas.width = 50 * total_width;

	draw_canvas (canvas, context);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function on_canvas_mouse_move (evt)
{
	var canvas = document.getElementById ('streetscape_canvas');
	var rect = canvas.getBoundingClientRect();

	var x = evt.clientX - rect.left;
	var y = evt.clientY - rect.top;

	determine_current_element_from_x (canvas, x);

	redraw_canvas ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function on_canvas_mouse_click (evt)
{
	var canvas = document.getElementById ('streetscape_canvas');
	var rect = canvas.getBoundingClientRect();

	var x = evt.clientX - rect.left;
	var y = evt.clientY - rect.top;

	determine_current_element_from_x (canvas, x);

	redraw_canvas ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_move_left ()
{
	if (current_element != undefined)
	{
		if (current_element > 0)
		{
			current_element -= 1;
			redraw_canvas ();
		}
	}
	else if (street_layout.length > 0)
	{
		current_element = 0;
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_move_right ()
{
	if (current_element != undefined)
	{
		if (current_element < street_layout.length - 1)
		{
			current_element += 1;
			redraw_canvas ();
		}
	}
	else if (street_layout.length > 0)
	{
		current_element = street_layout.length - 1;
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_remove_element ()
{
	if (current_element != undefined)
	{
		if (street_layout.length > 1)
		{
			street_layout.splice (current_element, 1);
			current_element = undefined;
			on_canvas_resize ();
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_add_element ()
{
	if (current_element != undefined)
	{
		new_element = { type: 'unallocated', width: 3.0 };

		if (to_left_of_current_element)
		{
			street_layout.splice (current_element, 0, new_element);
		}
		else
		{
			street_layout.splice (current_element + 1, 0, new_element);
			current_element = current_element + 1;
		}

		on_canvas_resize ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_direction_up ()
{
	if (current_element != undefined)
	{
		var type = street_layout[current_element].type;
		var type_info = type_information[type];

		if (type_info.directional)
		{
			street_layout[current_element].direction = 'up';
			redraw_canvas ();
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_direction_down ()
{
	if (current_element != undefined)
	{
		var type = street_layout[current_element].type;
		var type_info = type_information[type];

		if (type_info.directional)
		{
			street_layout[current_element].direction = 'down';
			redraw_canvas ();
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_turn_left ()
{
	if (current_element != undefined)
	{
		var type = street_layout[current_element].type;
		var type_info = type_information[type];

		if (type_info.turning)
		{
			street_layout[current_element].turn = 'left';
			redraw_canvas ();
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_turn_right ()
{
	if (current_element != undefined)
	{
		var type = street_layout[current_element].type;
		var type_info = type_information[type];

		if (type_info.turning)
		{
			street_layout[current_element].turn = 'right';
			redraw_canvas ();
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_increase_width ()
{
	if (current_element != undefined)
	{
		var type = street_layout[current_element].type;
		var type_info = type_information[type];

		var width =
			(Math.floor (street_layout[current_element].width * 10) + 1) /
			10.0;

		if (width <= type_info.max_width)
		{
			street_layout[current_element].width = width;
			on_canvas_resize ();
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_decrease_width ()
{
	if (current_element != undefined)
	{
		var type = street_layout[current_element].type;
		var type_info = type_information[type];

		var width =
			(Math.floor (street_layout[current_element].width * 10) - 1) /
			10.0;

		if (width >= type_info.min_width)
		{
			street_layout[current_element].width = width;
			on_canvas_resize ();
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_make_bus ()
{
	if (current_element != undefined)
	{
		street_layout[current_element].type = 'bus';
		if (street_layout[current_element].direction == undefined)
		{
			street_layout[current_element].direction = 'up';
		}
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_make_grass ()
{
	if (current_element != undefined)
	{
		street_layout[current_element].type = 'grass';
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_make_unallocated ()
{
	if (current_element != undefined)
	{
		street_layout[current_element].type = 'unallocated';
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_make_refuge ()
{
	if (current_element != undefined)
	{
		street_layout[current_element].type = 'refuge';
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_make_cycleway ()
{
	if (current_element != undefined)
	{
		street_layout[current_element].type = 'cycle';
		if (street_layout[current_element].direction == undefined)
		{
			street_layout[current_element].direction = 'up';
		}
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_make_footway ()
{
	if (current_element != undefined)
	{
		street_layout[current_element].type = 'foot';
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_make_bicycle_parking ()
{
	if (current_element != undefined)
	{
		street_layout[current_element].type = 'cycleparking';
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_make_traffic ()
{
	if (current_element != undefined)
	{
		street_layout[current_element].type = 'traffic';
		if (street_layout[current_element].direction == undefined)
		{
			street_layout[current_element].direction = 'up';
		}
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_make_parking ()
{
	if (current_element != undefined)
	{
		street_layout[current_element].type = 'parking';
		if (street_layout[current_element].direction == undefined)
		{
			street_layout[current_element].direction = 'up';
		}
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_make_turn ()
{
	if (current_element != undefined)
	{
		street_layout[current_element].type = 'turn';
		if (street_layout[current_element].direction == undefined)
		{
			street_layout[current_element].direction = 'up';
		}
		if (street_layout[current_element].turn == undefined)
		{
			street_layout[current_element].turn = 'left';
		}
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_toggle_raised ()
{
	if (current_element != undefined)
	{
		if (street_layout[current_element].raised)
		{
			street_layout[current_element].raised = false;
		}
		else
		{
			street_layout[current_element].raised = true;
		}
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_make_tree ()
{
	if (current_element != undefined)
	{
		street_layout[current_element].type = 'tree';
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function do_reseed ()
{
	if (current_element != undefined)
	{
		street_layout[current_element].seed = Math.random ();
	}
	redraw_canvas ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

var key_map = {
	8: do_remove_element, // backspace
	13: do_add_element, // enter
	37: do_move_left, // left arrow
	38: do_direction_up, // up arrow
	39: do_move_right, // right arrow
	40: do_direction_down, // down arrow
	46: do_remove_element, // delete
	61: do_increase_width, // +
	65: do_make_grass, // a
	66: do_make_bus, // b
	67: do_make_cycleway, // c
	69: do_make_refuge, // e
	70: do_make_footway, // f
	71: do_make_traffic, // g
	80: do_make_parking, // p
	81: do_reseed, // q
	82: do_toggle_raised, // r
	83: do_make_bicycle_parking, // s
	84: do_make_tree, // t
	85: do_make_turn, // u
	88: do_turn_right, // x
	89: do_make_unallocated, // y
	90: do_turn_left, // z
	187: do_increase_width, // =
	173: do_decrease_width, // -
	189: do_decrease_width, // _
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function on_canvas_keydown (evt)
{
	var kc = evt.keyCode;

	var func = key_map[kc];

	if (func)
	{
		func ();
	}
	else
	{
		console.log ('Unknown keyCode', evt.keyCode);
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function tiles_loaded ()
{
	tiles_to_load -= 1;

	if (tiles_to_load == 0)
	{
		redraw_canvas ();
	}
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function on_narrow_clicked ()
{
	do_decrease_width ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function on_widen_clicked ()
{
	do_increase_width ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function on_delete_clicked ()
{
	do_remove_element ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function on_new_clicked ()
{
	do_add_element ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function on_save_as ()
{
	var canvas = document.getElementById ('streetscape_canvas');
	var save_as = document.getElementById ('save_as');

	current_element = undefined;
	redraw_canvas ();

	var data = canvas.toDataURL ('image/png');
	data = data.substr(data.indexOf(',') + 1).toString();

	var data_input = document.createElement ('input');
	data_input.setAttribute ('name', 'imgdata');
	data_input.setAttribute ('value', data);
	data_input.setAttribute ('type', 'hidden');

	var name_input = document.createElement ('input');
	name_input.setAttribute ('name', 'name');
	name_input.setAttribute ('value', 'streetscape.png');

	var form = document.createElement ('form');
	form.method = 'post';
	form.action = 'save_image.php';
	form.appendChild (data_input);
	form.appendChild (name_input);
	document.body.appendChild (form);
	form.submit ();
	document.body.removeChild (form);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function assign_function (element_id, action, func)
{
	var element = document.getElementById (element_id);

	element.addEventListener (action, func, false);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
////
//// On Body Load
////
//// Called from the "onload" callback on <body>
////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function on_body_load ()
{
	var canvas = document.getElementById ('streetscape_canvas');
	var context = canvas.getContext ('2d');

	if (location.hash.length > 1)
	{
		parse_location_hash (location.hash);
	}

	tiles_to_load = 4;

	tile1_image = new Image ();
	tile1_image.onload = tiles_loaded;
	tile1_image.src = 'tiles-1.png';

	tile2_image = new Image ();
	tile2_image.onload = tiles_loaded;
	tile2_image.src = 'tiles-2.png';

	base_cycle_image = new Image ();
	base_cycle_image.onload = tiles_loaded;
	base_cycle_image.src = 'base_cycle.png';

	base_person_image = new Image ();
	base_person_image.onload = tiles_loaded;
	base_person_image.src = 'base_person.png';


	window.addEventListener ('resize', on_canvas_resize, false);
	canvas.addEventListener ('click', on_canvas_mouse_click, false);
	window.addEventListener ('keydown', on_canvas_keydown, false);

	assign_function ('save_as_button', 'click', on_save_as);
	assign_function ('widen_button', 'click', do_increase_width);
	assign_function ('narrow_button', 'click', do_decrease_width);
	assign_function ('delete_button', 'click', do_remove_element);
	assign_function ('new_button', 'click', do_add_element);
	assign_function ('make_grass', 'click', do_make_grass);
	assign_function ('make_tree', 'click', do_make_tree);
	assign_function ('make_bus', 'click', do_make_bus);
	assign_function ('make_cycleway', 'click', do_make_cycleway);
	assign_function ('make_cyclepark', 'click', do_make_bicycle_parking);
	assign_function ('make_refuge', 'click', do_make_refuge);
	assign_function ('make_footway', 'click', do_make_footway);
	assign_function ('make_traffic', 'click', do_make_traffic);
	assign_function ('make_parking', 'click', do_make_parking);
	assign_function ('make_raised', 'click', do_toggle_raised);
	assign_function ('make_up', 'click', do_direction_up);
	assign_function ('make_down', 'click', do_direction_down);
	assign_function ('make_turn', 'click', do_make_turn);
	assign_function ('make_left', 'click', do_turn_left);
	assign_function ('make_right', 'click', do_turn_right);

	on_canvas_resize ();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function milton_road ()
{
	var canvas = document.getElementById ('streetscape_canvas');
	var context = canvas.getContext ('2d');
	globalContext = context;
	var cycle_y = 253;
	var person_y = 225;

	draw_specific_cycle(context, 'up', 3, 0, 1, 8, 100, cycle_y);
	draw_specific_cycle(context, 'down', 1, 0, 0, 6, 145, cycle_y);
	draw_specific_cycle(context, 'down', 5, 0, 1, 2, 190, cycle_y);

	draw_specific_cycle(context, 'down', 1, 2, 0, 4, 770, cycle_y);
	draw_specific_cycle(context, 'down', 3, 2, 1, 16, 815, cycle_y);

	context.scale (1, -1);
	draw_specific_person(context, 2.0, 28, 15, person_y);
	draw_specific_person(context, 2.0, 18, 865, person_y);
	draw_specific_person(context, 2.0, 27, 910, person_y);

	context.scale (1, -1);

	context.drawImage
	(
		tile1_image,
		28*24, 28*24,
		11*24, 11*24,
		520, 205,
		3 * 50, 3 * 50
	);
	context.drawImage
	(
		tile1_image,
		0*24, 32*24,
		8*24, 8*24,
		370, 247,
		2.5 * 50, 2.5 * 50
	);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
