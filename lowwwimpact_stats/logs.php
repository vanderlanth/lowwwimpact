<?php

//validators 
$v0 = FALSE;
$v1 = FALSE;
$v2 = FALSE;
$v3 = FALSE;
$v4 = FALSE;
$v5 = FALSE;
$v6 = FALSE;
$v7 = FALSE;

$url        = $_SERVER['REQUEST_URI'];
$parts      = parse_url($url);

parse_str($parts['query'], $query);
$url_request = $query['url'];

$date = date('Y-m');
$filename = './log/'.$date.'.log';
$path_parts = pathinfo($filename);

if ($url_request == 'TRUE') {
    $request = json_decode(file_get_contents('php://input'), true);
    $save = htmlentities($request, ENT_QUOTES, 'UTF-8');

    $split = explode(', ', $save);

    if (sizeof($split) == 7) {
        $v0 = TRUE;
    }

    if (is_numeric($split[0]) && 
        strlen($split[0]) < 16
    ) {
        $v1 = TRUE;
    }

    if (str_starts_with($split[1], '/') &&
        strlen($split[1]) < 1000
    ) {
        $v2 = TRUE;
    }

    if (is_numeric($split[2]) == FALSE && 
        strlen($split[2]) == 2
    ) {
        $v3 = TRUE;
    }

    if (is_numeric($split[3]) && 
        strlen($split[3]) <= 3 &&
        $split[3] <= 100 &&
        $split[3] >= 0
    ) {
        $v4 = TRUE;
    }

    if (is_numeric($split[4]) && 
        strlen($split[4]) <= 5 &&
        $split[4] <= 10000 &&
        $split[4] >= 0
    ) {
        $v5 = TRUE;
    }

    if (is_numeric($split[5]) && 
        strlen($split[5]) <= 16 &&
        $split[5] >= 0
    ) {
        $v6 = TRUE;
    }

    if (is_numeric($split[6]) && 
        strlen($split[6]) <= 16 &&
        $split[6] >= 0
    ) {
        $v7 = TRUE;
    }

    if ($v0 == TRUE && 
        $v1 == TRUE && 
        $v2 == TRUE && 
        $v3 == TRUE && 
        $v4 == TRUE && 
        $v5 == TRUE && 
        $v6 == TRUE && 
        $v7 == TRUE &&
        $path_parts['extension'] == 'log'
    ) {
        $stream = fopen($filename, 'a+');
        fwrite($stream, $save . "\n");
        fclose($stream);
    } else {
       return FALSE;
    }
    
} else {
    $request = file_get_contents('./log/'.$date);
    echo $request;
}

?>
