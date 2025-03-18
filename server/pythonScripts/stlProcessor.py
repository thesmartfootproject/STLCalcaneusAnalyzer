#!/usr/bin/env python3
import os
import sys
import json
import numpy as np
import trimesh

# Load an STL file
def load_stl(file_path):
    return trimesh.load(file_path)

# Compute the minimum distances between two sets of points
def compute_distances(points_a, points_b):
    distances = np.linalg.norm(points_a[:, None, :] - points_b[None, :, :], axis=-1)
    min_dist = np.min(distances)
    min_idx = np.unravel_index(np.argmin(distances, axis=None), distances.shape)
    return min_dist, min_idx

# Batch process screws
def process_screws_batch(medial_file, lateral_file, screws_dir, tolerance=0.5):
    logs = []
    logs.append("=== Processing Started ===\n")
    
    medial = load_stl(medial_file)
    lateral = load_stl(lateral_file)

    medial_points = np.array(medial.vertices)
    lateral_points = np.array(lateral.vertices)

    mean_x_medial = float(np.mean(medial_points[:, 0]))
    mean_x_lateral = float(np.mean(lateral_points[:, 0]))

    side = "Left Calcaneus" if mean_x_medial > mean_x_lateral else "Right Calcaneus"
    logs.append("=== Side Detection ===\n")
    logs.append(f"Mean X (Medial) = {mean_x_medial:.2f} mm")
    logs.append(f"Mean X (Lateral) = {mean_x_lateral:.2f} mm")
    logs.append(f"Result: This is a {side}\n")

    results = []
    
    # Handle directory or single STL file
    if os.path.isdir(screws_dir):
        screw_files = [f for f in os.listdir(screws_dir) if f.lower().endswith(".stl")]
        screws_path = screws_dir
    else:
        screw_files = [os.path.basename(screws_dir)]
        screws_path = os.path.dirname(screws_dir)
    
    for screw_file in screw_files:
        logs.append(f"\nProcessing: {screw_file}")
        
        screw_path = os.path.join(screws_path, screw_file) if os.path.isdir(screws_dir) else screws_dir
        screw = load_stl(screw_path)
        screw_points = np.array(screw.vertices)

        min_dist_medial, medial_idx = compute_distances(screw_points, medial_points)
        min_dist_lateral, lateral_idx = compute_distances(screw_points, lateral_points)

        breach_detected = False
        breach_status = "No breach"
        breach_info = ""
        breach_points = []

        if min_dist_medial < tolerance:
            breach_detected = True
            breach_point = screw_points[medial_idx[0]].tolist()
            breach_points.append(breach_point)
            
            breach_info += f"Medial wall breach at {breach_point} mm\n"
            breach_status = "Medial breach"
            
        if min_dist_lateral < tolerance:
            breach_detected = True
            breach_point = screw_points[lateral_idx[0]].tolist()
            breach_points.append(breach_point)
            
            breach_info += f"Lateral wall breach at {breach_point} mm\n"
            breach_status = "Lateral breach" if breach_status == "No breach" else "Both breach"

        if breach_detected:
            logs.append(f"🚨 Screw Breach Detected:\n{breach_info}")
        else:
            logs.append("No breach detected.\n")

        logs.append(f"Shortest distance to medial wall = {min_dist_medial:.2f} mm")
        logs.append(f"Shortest distance to lateral wall = {min_dist_lateral:.2f} mm")
        
        result = {
            "fileName": screw_file,
            "distanceToMedial": float(min_dist_medial),
            "distanceToLateral": float(min_dist_lateral),
            "breachStatus": breach_status,
            "breachPoints": breach_points if breach_points else None
        }
        
        results.append(result)
    
    logs.append("\n=== Processing Completed ===")
    
    return {
        "side": side,
        "meanXMedial": mean_x_medial,
        "meanXLateral": mean_x_lateral,
        "results": results,
        "logs": "\n".join(logs)
    }

# Main
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 5:
        print("Usage: python stlProcessor.py <medial_file> <lateral_file> <screws_dir> <tolerance>")
        sys.exit(1)
    
    medial_file = sys.argv[1]
    lateral_file = sys.argv[2]
    screws_dir = sys.argv[3]
    tolerance = float(sys.argv[4])
    
    result = process_screws_batch(medial_file, lateral_file, screws_dir, tolerance)
    print(json.dumps(result))
