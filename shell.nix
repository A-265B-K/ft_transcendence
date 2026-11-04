{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = with pkgs; [
    gnumake
    docker_29
    docker-compose
    openssl
  ];
}
