const React = require('react');

function MeshProvider({ children }) {
  return children;
}

function CardanoWallet() {
  return null;
}

function MeshBadge() {
  return null;
}

function useWallet() {
  return { connected: false, wallet: null };
}

module.exports = {
  MeshProvider,
  CardanoWallet,
  MeshBadge,
  useWallet,
};
