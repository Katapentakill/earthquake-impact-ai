import math


class RadiusCalculator:
    """
    Calculate the radius of seismic impact based on magnitude and depth.
    Uses empirical formulas from seismology studies.
    """

    @staticmethod
    def calculate_radius(magnitude: float, depth_km: float) -> float:
        """
        Calculate the impact radius in kilometers.

        Formula based on:
        - Wells & Coppersmith (1994) empirical relationships
        - Modified Gutenberg-Richter for felt radius

        Args:
            magnitude: Earthquake magnitude (Richter/Moment scale)
            depth_km: Depth of hypocenter in kilometers

        Returns:
            Radius in kilometers where significant effects are expected
        """
        # Base radius calculation using exponential relationship with magnitude
        # Each magnitude unit roughly doubles the affected area
        base_radius = 10 ** (0.5 * magnitude - 0.8)

        # Depth correction factor
        # Shallow earthquakes (< 70km) have larger surface impact
        # Deep earthquakes (> 300km) have reduced surface effects
        if depth_km < 70:
            depth_factor = 1.0 + (70 - depth_km) / 100
        elif depth_km > 300:
            depth_factor = 0.5 + (700 - depth_km) / 800
        else:
            depth_factor = 1.0

        # Calculate final radius
        radius = base_radius * depth_factor

        # Apply magnitude-specific adjustments
        if magnitude >= 8.0:
            # Mega-earthquakes can affect continental scales
            radius *= 1.5
        elif magnitude >= 7.0:
            radius *= 1.2
        elif magnitude < 5.0:
            # Small earthquakes have limited reach
            radius *= 0.7

        # Minimum and maximum bounds
        radius = max(10, min(radius, 5000))

        return round(radius, 2)

    @staticmethod
    def calculate_intensity_zones(magnitude: float, depth_km: float) -> dict:
        """
        Calculate multiple intensity zones (like Modified Mercalli Scale zones)

        Returns:
            dict with different intensity radii
        """
        base_radius = RadiusCalculator.calculate_radius(magnitude, depth_km)

        return {
            "extreme_damage": base_radius * 0.2,  # Zone of catastrophic damage
            "severe_damage": base_radius * 0.4,   # Severe structural damage
            "moderate_damage": base_radius * 0.6,  # Moderate damage expected
            "light_damage": base_radius * 0.8,     # Light damage, felt strongly
            "felt_area": base_radius,              # Area where earthquake is felt
        }

    @staticmethod
    def estimate_energy_release(magnitude: float) -> float:
        """
        Estimate energy release in Joules

        Formula: log10(E) = 1.5M + 4.8
        where E is energy in Joules, M is magnitude
        """
        return 10 ** (1.5 * magnitude + 4.8)
