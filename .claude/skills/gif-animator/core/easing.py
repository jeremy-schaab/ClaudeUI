"""
Easing Functions for Animations

Standard easing functions for smooth animations.
All functions take a progress value (0.0 to 1.0) and return an eased value (0.0 to 1.0).
"""
import math
from typing import Callable

# Type alias for easing functions
EasingFunction = Callable[[float], float]


# Linear
def linear(t: float) -> float:
    """No easing, linear interpolation"""
    return t


# Quadratic
def ease_in_quad(t: float) -> float:
    """Accelerating from zero velocity"""
    return t * t


def ease_out_quad(t: float) -> float:
    """Decelerating to zero velocity"""
    return t * (2 - t)


def ease_in_out_quad(t: float) -> float:
    """Acceleration until halfway, then deceleration"""
    return 2 * t * t if t < 0.5 else -1 + (4 - 2 * t) * t


# Cubic
def ease_in_cubic(t: float) -> float:
    """Accelerating from zero velocity"""
    return t * t * t


def ease_out_cubic(t: float) -> float:
    """Decelerating to zero velocity"""
    return (--t) * t * t + 1


def ease_in_out_cubic(t: float) -> float:
    """Acceleration until halfway, then deceleration"""
    return 4 * t * t * t if t < 0.5 else (t - 1) * (2 * t - 2) * (2 * t - 2) + 1


# Quartic
def ease_in_quart(t: float) -> float:
    """Accelerating from zero velocity"""
    return t * t * t * t


def ease_out_quart(t: float) -> float:
    """Decelerating to zero velocity"""
    return 1 - (--t) * t * t * t


def ease_in_out_quart(t: float) -> float:
    """Acceleration until halfway, then deceleration"""
    return 8 * t * t * t * t if t < 0.5 else 1 - 8 * (--t) * t * t * t


# Quintic
def ease_in_quint(t: float) -> float:
    """Accelerating from zero velocity"""
    return t * t * t * t * t


def ease_out_quint(t: float) -> float:
    """Decelerating to zero velocity"""
    return 1 + (--t) * t * t * t * t


def ease_in_out_quint(t: float) -> float:
    """Acceleration until halfway, then deceleration"""
    return 16 * t * t * t * t * t if t < 0.5 else 1 + 16 * (--t) * t * t * t * t


# Sine
def ease_in_sine(t: float) -> float:
    """Accelerating from zero velocity"""
    return 1 - math.cos(t * math.pi / 2)


def ease_out_sine(t: float) -> float:
    """Decelerating to zero velocity"""
    return math.sin(t * math.pi / 2)


def ease_in_out_sine(t: float) -> float:
    """Acceleration until halfway, then deceleration"""
    return -(math.cos(math.pi * t) - 1) / 2


# Exponential
def ease_in_expo(t: float) -> float:
    """Accelerating from zero velocity"""
    return 0 if t == 0 else math.pow(2, 10 * (t - 1))


def ease_out_expo(t: float) -> float:
    """Decelerating to zero velocity"""
    return 1 if t == 1 else 1 - math.pow(2, -10 * t)


def ease_in_out_expo(t: float) -> float:
    """Acceleration until halfway, then deceleration"""
    if t == 0 or t == 1:
        return t
    if t < 0.5:
        return math.pow(2, 20 * t - 10) / 2
    return (2 - math.pow(2, -20 * t + 10)) / 2


# Circular
def ease_in_circ(t: float) -> float:
    """Accelerating from zero velocity"""
    return 1 - math.sqrt(1 - t * t)


def ease_out_circ(t: float) -> float:
    """Decelerating to zero velocity"""
    return math.sqrt(1 - (--t) * t)


def ease_in_out_circ(t: float) -> float:
    """Acceleration until halfway, then deceleration"""
    if t < 0.5:
        return (1 - math.sqrt(1 - 4 * t * t)) / 2
    return (math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2


# Back
def ease_in_back(t: float, s: float = 1.70158) -> float:
    """Back easing in - backing up before going forward"""
    return t * t * ((s + 1) * t - s)


def ease_out_back(t: float, s: float = 1.70158) -> float:
    """Back easing out - going forward and overshooting"""
    t -= 1
    return t * t * ((s + 1) * t + s) + 1


def ease_in_out_back(t: float, s: float = 1.70158) -> float:
    """Back easing in and out"""
    s *= 1.525
    if t < 0.5:
        return (4 * t * t * ((s + 1) * 2 * t - s)) / 2
    return ((2 * t - 2) ** 2 * ((s + 1) * (2 * t - 2) + s) + 2) / 2


# Elastic
def ease_in_elastic(t: float, amplitude: float = 1, period: float = 0.3) -> float:
    """Elastic easing in - like a rubber band"""
    if t == 0 or t == 1:
        return t
    s = period / 4
    t -= 1
    return -(amplitude * math.pow(2, 10 * t) * math.sin((t - s) * (2 * math.pi) / period))


def ease_out_elastic(t: float, amplitude: float = 1, period: float = 0.3) -> float:
    """Elastic easing out - like a rubber band"""
    if t == 0 or t == 1:
        return t
    s = period / 4
    return amplitude * math.pow(2, -10 * t) * math.sin((t - s) * (2 * math.pi) / period) + 1


def ease_in_out_elastic(t: float, amplitude: float = 1, period: float = 0.3) -> float:
    """Elastic easing in and out"""
    if t == 0 or t == 1:
        return t
    s = period / 4
    t = t * 2 - 1
    if t < 0:
        return -0.5 * (amplitude * math.pow(2, 10 * t) * math.sin((t - s) * (2 * math.pi) / period))
    return amplitude * math.pow(2, -10 * t) * math.sin((t - s) * (2 * math.pi) / period) * 0.5 + 1


# Bounce
def ease_out_bounce(t: float) -> float:
    """Bounce easing out"""
    if t < (1 / 2.75):
        return 7.5625 * t * t
    elif t < (2 / 2.75):
        t -= 1.5 / 2.75
        return 7.5625 * t * t + 0.75
    elif t < (2.5 / 2.75):
        t -= 2.25 / 2.75
        return 7.5625 * t * t + 0.9375
    else:
        t -= 2.625 / 2.75
        return 7.5625 * t * t + 0.984375


def ease_in_bounce(t: float) -> float:
    """Bounce easing in"""
    return 1 - ease_out_bounce(1 - t)


def ease_in_out_bounce(t: float) -> float:
    """Bounce easing in and out"""
    if t < 0.5:
        return ease_in_bounce(t * 2) * 0.5
    return ease_out_bounce(t * 2 - 1) * 0.5 + 0.5


# Special easing functions
def ease_snap(t: float, steps: int = 10) -> float:
    """Snap to discrete steps"""
    return math.floor(t * steps) / steps


def ease_smooth_step(t: float) -> float:
    """Smooth step function (S-curve)"""
    return t * t * (3 - 2 * t)


def ease_smoother_step(t: float) -> float:
    """Smoother step function (improved S-curve)"""
    return t * t * t * (t * (t * 6 - 15) + 10)


# Utility functions
def create_custom_bezier(p1: float, p2: float, p3: float, p4: float) -> EasingFunction:
    """
    Create a custom cubic bezier easing function

    Args:
        p1, p2, p3, p4: Control points (0.0 to 1.0)

    Returns:
        Custom easing function
    """
    def bezier(t: float) -> float:
        u = 1 - t
        return (3 * u * u * t * p1 +
                3 * u * t * t * p3 +
                t * t * t * p4)
    return bezier


def chain_easings(*easings: EasingFunction) -> EasingFunction:
    """
    Chain multiple easing functions together

    Args:
        *easings: Easing functions to chain

    Returns:
        Combined easing function
    """
    def chained(t: float) -> float:
        result = t
        for easing in easings:
            result = easing(result)
        return result
    return chained


def reverse_easing(easing: EasingFunction) -> EasingFunction:
    """
    Reverse an easing function

    Args:
        easing: Easing function to reverse

    Returns:
        Reversed easing function
    """
    def reversed_easing(t: float) -> float:
        return 1 - easing(1 - t)
    return reversed_easing


# Pre-defined common easings
EASING_PRESETS = {
    'linear': linear,
    'ease': ease_in_out_cubic,  # Default ease
    'ease-in': ease_in_cubic,
    'ease-out': ease_out_cubic,
    'ease-in-out': ease_in_out_cubic,
    'bounce': ease_out_bounce,
    'elastic': ease_out_elastic,
    'back': ease_out_back,
    'smooth': ease_smooth_step,
    'smoother': ease_smoother_step,
}


def get_easing(name: str) -> EasingFunction:
    """
    Get an easing function by name

    Args:
        name: Name of easing function

    Returns:
        Easing function

    Raises:
        ValueError: If easing name not found
    """
    easing = EASING_PRESETS.get(name.lower())
    if easing is None:
        raise ValueError(f"Unknown easing: {name}. Available: {', '.join(EASING_PRESETS.keys())}")
    return easing
