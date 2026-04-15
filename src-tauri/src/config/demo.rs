pub const DEMO_CONFIG: &str = "
-----------------------------------------------------
[[DAY]]
code=DEMO
-----------------------------------------------------

[[races.points]]
num=1
name=\"Start\"
type=\"DSS\"
odo=0
lat=52.291544
lon=104.283862
max_speed=140

[[races.points]]
num=2
name=\"Point 1\"
type=\"DZ\"
odo=1000
lat=52.286963
lon=104.271507
max_speed=140

[[races.points]]
num=3
name=\"Point 2\"
type=\"FZ\"
odo=2430
lat=52.291808
lon=104.250389
max_speed=40

[[races.points]]
num=4
name=\"Point 3\"
type=\"WPM\"
odo=4350
lat=52.308630
lon=104.239039
max_speed=140

[[races.points]]
num=5
name=\"Point 4\"
type=\"WPM\"
odo=6410
lat=52.325304
lon=104.234611
max_speed=140

[[races.points]]
num=6
name=\"Point 5\"
type=\"DZ\"
odo=8120
lat=52.325304
lon=104.212200
max_speed=140

[[races.points]]
num=7
name=\"Point 6\"
type=\"FZ\"
odo=10120
lat=52.317821
lon=104.203005
max_speed=40

[[races.points]]
num=8
name=\"Point 7\"
type=\"WPM\"
odo=12120
lat=52.327720
lon=104.184580
max_speed=140

[[races.points]]
num=9
name=\"Point 8\"
type=\"WPM\"
odo=14120
lat=52.350168
lon=104.138688
max_speed=140

[[races.points]]
num=10
name=\"Finish\"
type=\"ASS\"
odo=16120
lat=52.363042
lon=104.101072
max_speed=140

[[races.points]]

-----------------------------------------------------
[[RACE_PARAMS]]
-----------------------------------------------------
[INFO]
event_name=\"DEMO RACE\"
race_name=\"1\"

[races.sets]
total=10
max_speed=170

-----------------------------------------------------
[[POINT_TYPES]]
-----------------------------------------------------
[[races.types]]
caption=\"WPV\"
default_rad=200
is_open=false
ghost=false
in_game=true
arrow_threshold=800
max_speed=170

[[races.types]]
caption=\"WPM\"
default_rad=200
is_open=false
ghost=false
in_game=true
arrow_threshold=800
max_speed=170

[[races.types]]
caption=\"WPS\"
default_rad=50
is_open=false
ghost=false
in_game=true
arrow_threshold=1000
max_speed=170

[[races.types]]
caption=\"WPE\"
default_rad=200
is_open=false
ghost=false
in_game=true
arrow_threshold=5000
max_speed=170

[[races.types]]
caption=\"DSS\"
default_rad=100
is_open=true
ghost=false
in_game=false
arrow_threshold=800
max_speed=170

[[races.types]]
caption=\"FZ\"
default_rad=100
is_open=true
ghost=false
in_game=true
arrow_threshold=800
max_speed=50

[[races.types]]
caption=\"DZ\"
default_rad=200
is_open=false
ghost=false
in_game=true
arrow_threshold=800
max_speed=170

[[races.types]]
caption=\"WPC\"
default_rad=200
is_open=true
ghost=true
in_game=true
arrow_threshold=800
max_speed=170

[[races.types]]
caption=\"ASS\"
default_rad=200
is_open=false
ghost=false
in_game=true
arrow_threshold=1000
max_speed=170

[[races.types]]
caption=\"default\"
default_rad=200
is_open=false
ghost=false
in_game=true
arrow_threshold=800
max_speed=170
";