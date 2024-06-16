<?php

$auth_key = ''; //ADD YOUR API KEY

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, 'ipinfo.io?token='.$auth_key);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

$result = curl_exec($ch);

if (curl_errno($ch)) {
    echo 'default';
} 
else {
    $json       = json_decode($result);
    $country    = $json->country;
    $result     = json_encode($country);
    echo $result;
}

curl_close($ch);

?>