<?php
header('Content-Type:application/json');

@$phone = $_REQUEST['phone'];
@$user_name = $_REQUEST['user_name'];
@$did = $_REQUEST['did'];
@$addr = $_REQUEST['addr'];
@$sex = $_REQUEST['sex'];
if(empty($phone) || empty($user_name) || empty($did) || empty($addr) || empty($sex)){
  echo '[]';
  return;
}
$order_time = time()*1000;

$conn = mysqli_connect('127.0.0.1','root','','kaifanla');
$sql = 'SET NAMES UTF8';
mysqli_query($conn,$sql);

$sql = "INSERT INTO kf_order VALUES(NULL,'$phone','$user_name','$sex','$order_time','$addr','$did')";

$result = mysqli_query($conn,$sql);

$addResult = [];
if($result)
{
  //返回订单编号
  $addResult['oid'] = mysqli_insert_id($conn);
  $addResult['msg'] = 'succ';
}
else
{
  $addResult['msg'] = 'error';
}

$output = [];
$output[] = $addResult;

echo json_encode($output);
?>