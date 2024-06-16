<?php

$auth_key   = ''; //ADD YOUR API KEY
$base_url   = 'https://api.electricitymap.org/v3/';
$url        = $_SERVER['REQUEST_URI'];
$parts      = parse_url($url);

parse_str($parts['query'], $query);
$url_request = $query['url'];


$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $base_url.$url_request);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');

$headers = array();
$headers[] = 'Auth-Token: '.$auth_key;
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$result = curl_exec($ch);

if (curl_errno($ch)) {
    if (str_contains($url_request, 'power-breakdown')) {
        echo '30';
    } 
    else {
        echo '481';
    }
}
else {
    $json = json_decode($result);
    $bolExists = property_exists( $json, 'error' );

    $data_get;

    if ($bolExists == true) {
        if (str_contains($url_request, 'power-breakdown')) {
            echo '30';
        } 
        else {
            echo '481';
        }
    }
    else {
        if (str_contains($url_request, 'power-breakdown')) {
            $data_get = $json->fossilFreePercentage;
        } 
        else {
            $data_get = $json->carbonIntensity;
        }
        
        $result = json_encode($data_get);
        echo $result;
    }
}

curl_close($ch);

?>