"""
SafePay ML Scam Detector - Model Training & Evaluation Script

Trains a local scikit-learn Pipeline (TfidfVectorizer + LogisticRegression)
on clearly labeled synthetic legitimate and scam messages.
Saves model artifact to scam_model.joblib and writes model_metrics.json.

SYNTHETIC DATA NOTICE:
Training uses curated synthetic benchmark data for educational simulation.
It does not represent real-world national fraud statistics.
"""

import os
import json
from datetime import datetime, timezone
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)
from backend.app.ml.dataset import SYNTHETIC_DATASET


def train_and_save_model(output_dir: str = None) -> dict:
    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(__file__))

    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, "scam_model.joblib")
    metrics_path = os.path.join(output_dir, "model_metrics.json")

    texts = [sample[0] for sample in SYNTHETIC_DATASET]
    labels = [sample[1] for sample in SYNTHETIC_DATASET]

    total_samples = len(texts)
    scam_count = sum(labels)
    legit_count = total_samples - scam_count

    print(f"Total synthetic samples: {total_samples} ({legit_count} Legitimate, {scam_count} Scam)")

    # Stratified split: 75% train, 25% test
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.25, random_state=42, stratify=labels
    )

    print(f"Training split: {len(X_train)} samples | Testing split: {len(X_test)} samples")

    # Define TF-IDF + Logistic Regression pipeline
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            lowercase=True,
            max_features=1500,
            sublinear_tf=True
        )),
        ("clf", LogisticRegression(
            C=1.0,
            random_state=42,
            solver="liblinear"
        ))
    ])

    # Train model
    pipeline.fit(X_train, y_train)

    # Evaluate on test set
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    accuracy = float(accuracy_score(y_test, y_pred))
    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred).tolist()

    report_str = classification_report(y_test, y_pred, target_names=["Legitimate", "Scam"])
    print("\n--- Classification Report (Synthetic Held-Out Test Set) ---")
    print(report_str)
    print("Confusion Matrix [[TN, FP], [FN, TP]]:", cm)

    # Serialize trained pipeline artifact
    joblib.dump(pipeline, model_path)
    print(f"\nModel saved successfully to: {model_path}")

    # Record metrics metadata
    metrics_data = {
        "model_name": "SafePay-ML-ScamDetector",
        "algorithm": "TfidfVectorizer + LogisticRegression",
        "library": "scikit-learn",
        "version": "1.0.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_type": "Synthetic Indian Payment & Scam Communications",
        "dataset_disclaimer": "Curated synthetic dataset for local demonstration and safety-rule verification. Does not represent real-world national fraud statistics.",
        "sample_counts": {
            "total": total_samples,
            "train": len(X_train),
            "test": len(X_test),
            "legitimate": legit_count,
            "scam": scam_count
        },
        "evaluation_metrics": {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": cm
        },
        "model_file": os.path.basename(model_path)
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"Metrics metadata saved to: {metrics_path}")

    return metrics_data


if __name__ == "__main__":
    train_and_save_model()
