<?php
$name = $_POST['name'];
$address = $_POST['address'];
$mobile_number = $_POST['mobile'];
$age = $_POST['age'];
$status = $_POST['status'];




$email_from = 'info@safesighteyecare.in';

$email_subject = 'New Appointment Submission';

$email_body = "Patient Name: $name.\n".
              "Address: $address.\n".
              "Mobile: $mobile_number.\n".
              "Age: $age.\n".
              "Status: $status.";


$to = 'safesighteyeclinic@gmail.com';

$headers = "From: $email_from \r\n";

mail($to,$email_subject,$email_body,$headers);

header("Location: Appointment.html");
?>