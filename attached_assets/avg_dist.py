import os
import numpy as np
import trimesh
import matplotlib.pyplot as plt

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
    medial = load_stl(medial_file)
    lateral = load_stl(lateral_file)

    medial_points = np.array(medial.vertices)
    lateral_points = np.array(lateral.vertices)

    mean_x_medial = np.mean(medial_points[:, 0])
    mean_x_lateral = np.mean(lateral_points[:, 0])

    side = "Left Calcaneus" if mean_x_medial > mean_x_lateral else "Right Calcaneus"
    print(f"\n=== Side Detection ===\n")
    print(f"Mean X (Medial) = {mean_x_medial:.2f} mm")
    print(f"Mean X (Lateral) = {mean_x_lateral:.2f} mm")
    print(f"Result: This is a {side}\n")

    screw_files = [f for f in os.listdir(screws_dir) if f.endswith(".stl")]
    for screw_file in screw_files:
        print(f"\nProcessing: {screw_file}")
        screw = load_stl(os.path.join(screws_dir, screw_file))
        screw_points = np.array(screw.vertices)

        min_dist_medial, medial_idx = compute_distances(screw_points, medial_points)
        min_dist_lateral, lateral_idx = compute_distances(screw_points, lateral_points)

        breach_detected = False
        breach_info = ""

        if min_dist_medial < tolerance:
            breach_detected = True
            breach_info += f"Medial wall breach at {screw_points[medial_idx[0]]} mm\n"
        if min_dist_lateral < tolerance:
            breach_detected = True
            breach_info += f"Lateral wall breach at {screw_points[lateral_idx[0]]} mm\n"

        if breach_detected:
            print(f"🚨 Screw Breach Detected:\n{breach_info}")
        else:
            print(f"No breach detected.\n")

        print(f"Shortest distance to medial wall = {min_dist_medial:.2f} mm")
        print(f"Shortest distance to lateral wall = {min_dist_lateral:.2f} mm")

# Plot models for visualization
def plot_models(medial, lateral, screw, breach_points=None):
    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')

    medial_mesh = trimesh.Trimesh(vertices=medial.vertices, faces=medial.faces)
    lateral_mesh = trimesh.Trimesh(vertices=lateral.vertices, faces=lateral.faces)
    screw_mesh = trimesh.Trimesh(vertices=screw.vertices, faces=screw.faces)

    ax.plot_trisurf(*medial_mesh.vertices.T, triangles=medial_mesh.faces, color='red', alpha=0.5)
    ax.plot_trisurf(*lateral_mesh.vertices.T, triangles=lateral_mesh.faces, color='blue', alpha=0.5)
    ax.plot_trisurf(*screw_mesh.vertices.T, triangles=screw_mesh.faces, color='magenta', alpha=0.7)

    if breach_points:
        for point in breach_points:
            ax.scatter(*point, color='yellow', s=100, label='Breach Point')

    ax.set_xlabel('X (mm)')
    ax.set_ylabel('Y (mm)')
    ax.set_zlabel('Z (mm)')
    plt.legend()
    plt.show()

# Main
if __name__ == "__main__":
    medial_file = "path_to_medial_surface.stl"
    lateral_file = "path_to_lateral_surface.stl"
    screws_dir = "path_to_screws_directory"

    process_screws_batch(medial_file, lateral_file, screws_dir)
