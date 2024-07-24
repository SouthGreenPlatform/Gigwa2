import os
import git
import xml.etree.ElementTree as ET
import subprocess

# Dossier où les projets seront clonés
script_dir = os.path.dirname(os.path.abspath(__file__))
gigwa2_dir = os.path.dirname(script_dir)
parent_dir = os.path.dirname(gigwa2_dir)

# Fonction pour lire les modules depuis le bom/pom.xml
def get_modules_from_bom():
    bom_pom_path = os.path.join(gigwa2_dir, 'bom', 'pom.xml')
    tree = ET.parse(bom_pom_path)
    root = tree.getroot()
    namespaces = {'m': 'http://maven.apache.org/POM/4.0.0'}

    modules = []
    for module in root.findall(".//m:module", namespaces):
        module_path = module.text
        if module_path != '..':  # Ignore the parent module
            module_name = os.path.basename(module_path)
            modules.append(module_name)

    return modules

# Fonction pour cloner un dépôt avec la branche master
def clone_repo(repo_url, clone_path):
    full_clone_path = os.path.join(parent_dir, clone_path)
    if not os.path.exists(full_clone_path):
        print(f"Cloning {repo_url} into {full_clone_path} (branch: master)")
        git.Repo.clone_from(repo_url, full_clone_path, branch='master')
    else:
        print(f"Repository {repo_url} already exists at {full_clone_path}")

# Fonction pour analyser le pom.xml et extraire les dépendances fr.cirad
def extract_dependencies(pom_path):
    tree = ET.parse(pom_path)
    root = tree.getroot()
    namespaces = {'m': 'http://maven.apache.org/POM/4.0.0'}

    dependencies = []
    for dependency in root.findall(".//m:dependency", namespaces):
        group_id = dependency.find("m:groupId", namespaces).text
        if group_id == "fr.cirad":
            artifact_id = dependency.find("m:artifactId", namespaces).text
            version = dependency.find("m:version", namespaces).text
            dependencies.append((artifact_id, version))
    return dependencies

# Fonction pour faire un checkout sur une version spécifique
def checkout_version(repo_path, version):
    full_repo_path = os.path.join(parent_dir, repo_path)
    repo = git.Repo(full_repo_path)
    try:
        repo.git.checkout(version)
        print(f"Checked out {full_repo_path} to version {version}")
    except git.GitCommandError as e:
        print(f"Error: Unable to checkout version {version} in {full_repo_path}: {e}")

# Stocker les résultats
results = {}
seen_artifacts = set()

# Vérifier et analyser le pom.xml du projet actuel
current_pom_path = os.path.join(gigwa2_dir, "pom.xml")
if os.path.exists(current_pom_path):
    current_dependencies = extract_dependencies(current_pom_path)
    if current_dependencies:
        results['CurrentProject'] = []
        for artifact_id, version in current_dependencies:
            if artifact_id not in seen_artifacts:
                results['CurrentProject'].append((artifact_id, version))
                seen_artifacts.add(artifact_id)
else:
    print("Error: pom.xml not found in the Gigwa2 directory")

# Obtenir la liste des modules depuis bom/pom.xml
app_names = get_modules_from_bom()

# Cloner les projets et analyser les pom.xml
for app_name in app_names:
    repo_url = f"https://github.com/GuilhemSempere/{app_name}.git"
    clone_path = os.path.join(parent_dir, app_name)

    clone_repo(repo_url, clone_path)

    pom_path = os.path.join(clone_path, "pom.xml")
    if os.path.exists(pom_path):
        dependencies = extract_dependencies(pom_path)
        if dependencies:
            for artifact_id, version in dependencies:
                if artifact_id not in seen_artifacts:
                    if app_name not in results:
                        results[app_name] = []
                    results[app_name].append((artifact_id, version))
                    seen_artifacts.add(artifact_id)

# Affichage des résultats et checkout des versions dans cloned_projects
print("Dependencies:")

for app_name, deps in results.items():
    print(f"----- Project: {app_name} -----")
    for artifact_id, version in deps:
        print(f"      ArtifactId: {artifact_id}, Version: {version}")
        artifact_clone_path = os.path.join(parent_dir, artifact_id)
        # Vérifier si le projet de l'artefact est déjà cloné
        if os.path.exists(artifact_clone_path):
            # Faire un checkout sur la version
            checkout_version(artifact_clone_path, version)
        else:
            print(f"Error: Project for artifactId {artifact_id} not found in {parent_dir}")
    print(f"-------------------------------")

# Exécuter mvn install sur le pom.xml dans le dossier bom
print("Executing 'mvn install' on the bom/pom.xml...")
try:
    bom_dir = os.path.join(gigwa2_dir, 'bom')
    if os.path.exists(bom_dir):
        os.chdir(bom_dir)
        subprocess.run(['mvn', 'install', '-P', 'prod', '-f', 'pom.xml'], check=True)
        print("mvn install completed successfully on bom/pom.xml.")
    else:
        print(f"Error: bom directory not found in {gigwa2_dir}")
except subprocess.CalledProcessError as e:
    print(f"Error while running 'mvn install' on bom/pom.xml: {e}")
finally:
    os.chdir(script_dir)  # Retour au répertoire du script