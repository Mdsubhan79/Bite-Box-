<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo "Invalid email address.";
        exit;
    }

    // Optional: Save to file or database
    file_put_contents("subscribers.txt", $email . PHP_EOL, FILE_APPEND);

    echo "Subscription successful!";
} else {
    http_response_code(403);
    echo "Access denied.";
}
?>
