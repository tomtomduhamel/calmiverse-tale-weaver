import React from "react";
import { Navigate, useParams, useLocation } from "react-router-dom";

/**
 * Redirige vers `to` en interpolant les paramètres dynamiques (:id, :token, ...).
 * Corrige le bug de <Navigate> qui ne fait pas la substitution des params.
 * Préserve la query string et le hash de l'URL d'origine.
 */
const RedirectWithParams: React.FC<{ to: string }> = ({ to }) => {
  const params = useParams();
  const location = useLocation();

  const resolvedPath = Object.entries(params).reduce(
    (acc, [key, value]) => acc.split(`:${key}`).join(value ?? ""),
    to
  );

  return (
    <Navigate
      to={{ pathname: resolvedPath, search: location.search, hash: location.hash }}
      replace
    />
  );
};

export default RedirectWithParams;
