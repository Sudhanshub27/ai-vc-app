# ASL Sign Language Recognition

A machine learning project to recognize American Sign Language (ASL) alphabet gestures using a trained CNN model.

## Setup

### 1. Download the Dataset

Download the ASL Alphabet dataset from Kaggle:

**[ASL Alphabet Dataset](https://www.kaggle.com/datasets/grassknoted/asl-alphabet)**


After downloading, extract the contents and place them in the project root:
```
training-sign-lang/
├── asl_alphabet_train/
├── asl_alphabet_test/
├── train.py
├── model.py
└── camera.py
```

### 2. Install Dependencies

```bash
pip install tensorflow keras opencv-python numpy
```

### 3. Train the Model

```bash
python train.py
```

### 4. Run the Camera

```bash
python camera.py
```

## Project Structure

- `train.py` - Script to train the CNN model on the ASL dataset
- `model.py` - Model architecture definition
- `camera.py` - Real-time camera inference for sign language recognition
