<?php
require_once 'backend/MathEvaluator.php';

use App\MathEvaluator;

function test($expr, $expected) {
    try {
        $result = MathEvaluator::evaluate($expr);
        if (abs($result - $expected) < 1e-9) {
            echo "PASS: $expr = $expected\n";
        } else {
            echo "FAIL: $expr = $result, expected $expected\n";
        }
    } catch (Exception $e) {
        echo "FAIL: $expr threw exception: " . $e->getMessage() . "\n";
    }
}

test('8/(3-8/3)', 24);
test('2+3*4', 14);
test('(2+3)*4', 20);
test('24', 24);
test('24/1', 24);

try {
    MathEvaluator::evaluate('1/0');
    echo "FAIL: 1/0 did not throw\n";
} catch (Exception $e) {
    echo "PASS: 1/0 threw exception: " . $e->getMessage() . "\n";
}

try {
    MathEvaluator::evaluate('2++2');
    echo "FAIL: 2++2 did not throw\n";
} catch (Exception $e) {
    echo "PASS: 2++2 threw exception: " . $e->getMessage() . "\n";
}
