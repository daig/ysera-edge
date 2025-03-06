from http.server import BaseHTTPRequestHandler
import json
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            # Parse the received JSON data
            data = json.loads(post_data)
            experiment_description = data.get('experimentDescription', '')
            
            if not experiment_description:
                self._send_response(400, {'error': 'Experiment description is required'})
                return
            
            # Generate methods section using OpenAI API
            methods_section = self._generate_methods(experiment_description)
            
            # Return the generated methods section
            self._send_response(200, {'text': methods_section})
        
        except Exception as e:
            print(f"Error: {str(e)}")
            self._send_response(500, {'error': 'Failed to generate methods'})
    
    def _generate_methods(self, experiment_description):
        """Generate a detailed methods section based on the experiment description."""
        try:
            prompt = f"""
            Create a detailed research methods section based on the following experiment description:
            
            {experiment_description}
            
            Your response should include:
            1. Participant selection and recruitment criteria
            2. Materials and apparatus used
            3. Step-by-step experimental procedure
            4. Data collection methods
            5. Analysis approach
            
            Format this as a properly structured methods section suitable for an academic paper or grant application.
            """
            
            response = client.chat.completions.create(
                model="gpt-4-turbo",  # Or another appropriate model
                messages=[
                    {"role": "system", "content": "You are a scientific writing assistant specializing in creating detailed research methods sections based on experiment descriptions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            # Extract the generated text from the response
            return response.choices[0].message.content
        
        except Exception as e:
            print(f"Error generating methods: {str(e)}")
            # Return a simple fallback if the API call fails
            return "Error generating methods section. Please try again later."
    
    def _send_response(self, status_code, data):
        """Helper to send JSON responses."""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 