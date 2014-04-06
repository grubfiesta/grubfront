<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="">
    <link rel="shortcut icon" href="../../assets/ico/favicon.ico">
    <title>GrubFiesta: Explore|Discover|Order Food Online</title>
    <!-- Bootstrap CSS -->
    <link href="/assets/css/bootstrap.css" rel="stylesheet">
    <!-- Custom styles for this template -->
    <link href="/assets/css/bootstrap-theme.css" rel="stylesheet">
    <link href="/assets/css/style.css" rel="stylesheet">
    <script type="text/javascript">
        <?php
            $env =  getenv('APPLICATION_ENV');
            if(empty($env)){
                $env = 'local';
            }
        ?>
        Base.ENV = typeof window["ENV"] != "undefined" ? "<?php echo $env ?>";
    </script>
    <!-- HTML5 shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
    <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
    <![endif]-->
    <script data-main="/assets/js/app.js" src="/assets/js/libs/require.js" defer></script>
</head>
<body>
<div id="wrapper"></div>
</body>
</html>