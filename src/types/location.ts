/**
 * Interface for location data.
 * 
 * This interface defines the structure for location data, 
 * including address, city, longitude, and latitude.
 */
export interface LocationData {
  /**
   * The address of the location.
   */
  address: string;
  /**
   * The city of the location.
   */
  city: string;
  /**
   * The longitude of the location.
   */
  longitude: number;
  /**
   * The latitude of the location.
   */
  latitude: number;
}