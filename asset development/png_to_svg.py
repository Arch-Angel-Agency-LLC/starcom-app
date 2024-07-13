import os
from potrace import Bitmap

def convert_png_to_svg(input_file, output_file):
    try:
        # Check if the input file exists
        if not os.path.isfile(input_file):
            raise FileNotFoundError(f"The input file '{input_file}' does not exist.")
        
        # Check if the input file is a PNG
        if not input_file.lower().endswith('.png'):
            raise ValueError("The input file must be in PNG format.")

        # Load the PNG image
        bitmap = Bitmap(input_file)

        # Trace the bitmap to create paths
        path = bitmap.trace()

        # Save the result as an SVG
        path.save_as_svg(output_file)

        print(f'Conversion complete. SVG saved as {output_file}')
    except FileNotFoundError as e:
        print(f'Error(fileNotFound): {str(e)}')
    except ValueError as e:
        print(f'Error(value): {str(e)}')
    except Exception as e:
        print(f'Exception: An unexpected error occurred: {str(e)}')

if __name__ == "__main__":
    # Replace 'input.png' and 'output.svg' with your input and output file paths
    input_file = 'logo.png'
    output_file = 'logo.svg'

    convert_png_to_svg(input_file, output_file)
