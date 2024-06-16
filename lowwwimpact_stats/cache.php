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
$v8 = FALSE;
$v9 = FALSE;

$url        = $_SERVER['REQUEST_URI'];
$parts      = parse_url($url);

parse_str($parts['query'], $query);
$url_request = $query['url'];


if ($url_request == 'TRUE') {
    $request = file_get_contents('php://input');
    $save = $request;

    $data               = json_decode($save, true);
    $period             = $data['period'];
    $days               = $data['daily'][0];
    $views              = $data['views'];
    $fsp                = $data['fsp'];
    $mix                = $data['mix'];
    $min_bandwidth      = $data['min_bandwidth'];
    $plus_bandwidth     = $data['plus_bandwidth'];
    $distribution       = $data['distribution'][0];
    $expire             = $data['expire'];

    $filename           = './cache/'.$period.'.json';
    $path_parts = pathinfo($filename);

    //object length
    if (count($data) == 9) {
        $v0 = TRUE;
    }

    //period
    $period_test = explode('-', $period);
    if (is_numeric($period_test[0]) &&
        strlen($period_test[0]) == 4 &&
        is_numeric($period_test[1]) &&
        strlen($period_test[1]) == 2 &&
        strlen($period) == 7
    ) {
        $v1 = TRUE;
    }

    //fsp
    if (is_numeric($fsp) &&
        $fsp <= 100 &&
        $fsp >= 0
    ) {
        $v2 = TRUE;
    }

    //mix
    if (is_numeric($mix) &&
        $mix <= 2500 &&
        $mix >= 0
    ) {
        $v3 = TRUE;
    }

    //views
    if (is_numeric($views) &&
        strlen($views) <= 14 &&
        $views >= 0
    ) {
        $v4 = TRUE;
    }

    //minbw
    if (is_numeric($min_bandwidth) &&
        strlen($min_bandwidth) <= 16 &&
        $min_bandwidth >= 0
    ) {
        $v5 = TRUE;
    }

    //maxbw
    if (is_numeric($plus_bandwidth) &&
        strlen($plus_bandwidth) <= 16 &&
        $plus_bandwidth >= 0
    ) {
        $v6 = TRUE;
    }

    //expire
    if ($expire !== false) {
        $expire_test = gmdate("Y-m-d\TH:i:s\Z", $expire/1000);
        $expire_php_unix = $expire/1000; 
        if (is_numeric($expire) &&
            strlen($expire) <= 16 &&
            $expire >= 0 &&
            strtotime($expire_test) == (int)$expire_php_unix
        ) {
            $v7 = TRUE;
        }
    } else if( $expire == false) {
        $v7 = TRUE;
    }

    //days
    $nb_days = count($data['daily']);

    if ($nb_days == 1) {
        $day = $data['daily'][0][0];
        $min = $data['daily'][0][1];
        $max = $data['daily'][0][2];

        if (is_numeric($day) &&
            $day >= 0 &&
            $day <= 31 &&
            is_numeric($min) &&
            strlen($min) <= 16 &&
            $min >= 0 &&
            is_numeric($max) &&
            strlen($max) <= 16 &&
            $max >= 0
        ) {
            $v8 = TRUE;
        }
    } 
    else if ($nb_days != 1) {
        for ($i=0; $i < $nb_days; $i++) { 
            $day = $data['daily'][$i][0];
            $min = $data['daily'][$i][1];
            $max = $data['daily'][$i][2];
    
            if (is_numeric($day) &&
                $day >= 0 &&
                $day <= 31 &&
                is_numeric($min) &&
                strlen($min) <= 16 &&
                $min >= 0 &&
                is_numeric($max) &&
                strlen($max) <= 16 &&
                $max >= 0
            ) {
                $v8 = TRUE;
            } else {
                $v8 = FALSE;
            }
        }
    }
    

    //distribution
    $nb_distribution = count($data['distribution']);

    if ($nb_distribution == 1) {
        $d_page = $data['distribution'][0][0];
        $d_visit = $data['distribution'][0][1];
        $d_bw = $data['distribution'][0][2];

        if (str_starts_with($d_page, '/') &&
            strlen($d_page) < 1000 &&
            is_numeric($d_visit) &&
            strlen($d_visit) <= 14 &&
            $d_visit >= 0 &&
            is_numeric($d_bw) &&
            strlen($d_bw) <= 16 &&
            $d_bw >= 0
        ) {
            $v9 = TRUE;
        } 
    } 
    else if ($nb_distribution != 1) {
        for ($i=0; $i < $nb_distribution; $i++) { 
            $d_page = $data['distribution'][$i][0];
            $d_visit = $data['distribution'][$i][1];
            $d_bw = $data['distribution'][$i][2];
    
            if (str_starts_with($d_page, '/') &&
                strlen($d_page) < 1000 &&
                is_numeric($d_visit) &&
                strlen($d_visit) <= 14 &&
                $d_visit >= 0 &&
                is_numeric($d_bw) &&
                strlen($d_bw) <= 16 &&
                $d_bw >= 0
            ) {
                $v9 = TRUE;
            } else {
                $v9 = FALSE;
            }
        }    
    }

    if (json_validator($save) &&
         $v0 == TRUE &&
         $v1 == TRUE &&
         $v2 == TRUE &&
         $v3 == TRUE &&
         $v4 == TRUE &&
         $v5 == TRUE &&
         $v6 == TRUE &&
         $v7 == TRUE &&
         $v8 == TRUE &&
         $v9 == TRUE &&
         $path_parts['extension'] == 'json'
    ) {
        $stream = fopen($filename, 'w+');
        fwrite($stream, $save);
        fclose($stream);
    }
    else {
       return FALSE;
    }
    
} 
else {
    $request = file_get_contents('./cache/'.$date.'.json');
    echo $request;
}

function json_validator($data) { 
    if (!empty($data)) { 
        return is_string($data) &&  
          is_array(json_decode($data, true)) ? true : false; 
    } 
    return false; 
} 


?>
