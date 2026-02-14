/*---------------------------------------------------------------------------------------------
 *  CircuitForge — AI Hardware Design Studio
 *  Welcome screen content and configuration.
 *--------------------------------------------------------------------------------------------*/

export const WELCOME_CONTENT = {
	title: 'CircuitForge',
	tagline: 'Go from idea to hardware in seconds',
	description: 'Describe your hardware project, and CircuitForge will generate a complete Bill of Materials and interactive breadboard wiring diagram powered by Claude AI.',
	quickStart: [
		{
			label: 'New Hardware Project',
			description: 'Open the sidebar and describe your project idea',
			command: 'circuitforge.newProject',
		},
		{
			label: 'Configure API Key',
			description: 'Set your Claude API key in Settings',
			command: 'workbench.action.openSettings',
			args: 'circuitforge.claudeApiKey',
		},
	],
	exampleProjects: [
		{
			title: 'Temperature Monitor',
			description: 'DHT22 sensor with LCD display showing real-time temperature and humidity',
			idea: 'Temperature monitoring system with LCD display and buzzer alarm when temperature exceeds threshold',
		},
		{
			title: 'LED Strip Controller',
			description: 'NeoPixel LED strip controlled by Arduino with potentiometer for brightness and button for pattern selection',
			idea: 'WS2812B LED strip controller with Arduino, potentiometer for brightness, and button for pattern cycling',
		},
		{
			title: 'Robot Car',
			description: 'Arduino-powered car with ultrasonic obstacle avoidance and L298N motor driver',
			idea: 'Two-wheel robot car with HC-SR04 ultrasonic obstacle avoidance using L298N motor driver and Arduino',
		},
		{
			title: 'Weather Station',
			description: 'ESP32 weather station with multiple sensors and OLED display',
			idea: 'ESP32 weather station with BMP280 pressure sensor, DHT22 temperature/humidity, and SSD1306 OLED display',
		},
		{
			title: 'Smart Plant Watering',
			description: 'Soil moisture sensor with automatic pump relay and LCD status display',
			idea: 'Automatic plant watering system with soil moisture sensor, relay-controlled pump, and 16x2 LCD status display',
		},
	],
};
