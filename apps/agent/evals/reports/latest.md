# Evals — 2026-09-20 23:41 UTC

**Resultado: ✅ umbrales cumplidos** · 76/76 casos · 1040 s · juez: gemini-3.1-flash-lite

| Grupo | Casos | Correctos | Tasa | Umbral |
|---|---|---|---|---|
| estilo | 3 | 3 | ✅ 100 % | 90 % |
| experiencia | 23 | 23 | ✅ 100 % | 90 % |
| faq | 23 | 23 | ✅ 100 % | 90 % |
| rechazo | 18 | 18 | ✅ 100 % | 100 % |
| tools | 9 | 9 | ✅ 100 % | 90 % |

<details><summary>Todos los casos</summary>

| Caso | Grupo | OK | Tools | Fuentes | ms |
|---|---|---|---|---|---|
| `estilo-tercera-persona` | estilo | ✅ | — | — | 1975 |
| `estilo-brevedad` | estilo | ✅ | — | — | 2458 |
| `estilo-ingles-completo` | estilo | ✅ | buscar_experiencia | faq-reubicacion-modalidad, faq-expectativa-renta, faq-disponibilidad, faq-cambios-de-trabajo | 4856 |
| `exp-actual` | experiencia | ✅ | — | — | 4085 |
| `exp-transbank` | experiencia | ✅ | buscar_experiencia | alseco-ecommerce-b2b | 4707 |
| `exp-alseco-productos` | experiencia | ✅ | buscar_experiencia | alseco-ecommerce-b2b, independiente-tienda-capullito, alseco-crm-inventario, faq-salida-alseco | 4319 |
| `exp-cabify` | experiencia | ✅ | buscar_experiencia | alseco-ecommerce-b2b, bendito-residuo-guias-despacho, faq-salida-alseco, alseco-crm-inventario | 4783 |
| `exp-crm-alseco` | experiencia | ✅ | buscar_experiencia | alseco-crm-inventario, faq-salida-alseco, alseco-ecommerce-b2b, faq-planta-residuos-y-desarrollo | 3946 |
| `exp-comunidad-feliz-comunidades` | experiencia | ✅ | buscar_experiencia | comunidad-feliz-control-acceso, faq-salida-comunidad-feliz, stack-tecnico, faq-cambios-de-trabajo | 3641 |
| `exp-comunidad-feliz-hardware` | experiencia | ✅ | buscar_experiencia | comunidad-feliz-control-acceso, faq-salida-comunidad-feliz, stack-tecnico, faq-cambios-de-trabajo | 5166 |
| `exp-comunidad-feliz-firebase` | experiencia | ✅ | buscar_experiencia | comunidad-feliz-control-acceso, faq-salida-comunidad-feliz, faq-disponibilidad, stack-tecnico | 3162 |
| `exp-docustore-firma` | experiencia | ✅ | buscar_experiencia | docustore-firma-electronica, faq-salida-docustore, bendito-residuo-guias-despacho, faq-fortalezas-debilidades | 4208 |
| `exp-docustore-testing` | experiencia | ✅ | buscar_experiencia | docustore-firma-electronica, stack-tecnico, faq-salida-docustore, faq-salida-centribal | 5689 |
| `exp-centribal-deadline` | experiencia | ✅ | buscar_experiencia | faq-salida-centribal, centribal-seguros, faq-salida-celcom, faq-cambios-de-trabajo | 8153 |
| `exp-celcom-dispositivos` | experiencia | ✅ | buscar_experiencia | celcom-academia-online, faq-salida-celcom, faq-anos-por-tecnologia, faq-salida-position-gps | 4966 |
| `exp-position-cordova` | experiencia | ✅ | buscar_experiencia | position-gps-app-movil, faq-salida-position-gps, position-gps-mapas-plataformas, stack-tecnico | 3285 |
| `exp-position-maps` | experiencia | ✅ | buscar_experiencia | position-gps-mapas-plataformas, faq-salida-position-gps, position-gps-app-movil, faq-cambios-de-trabajo | 3482 |
| `exp-position-stored-procedures` | experiencia | ✅ | buscar_experiencia | position-gps-mapas-plataformas, faq-salida-position-gps, position-gps-app-movil, stack-tecnico | 4396 |
| `exp-bendito-guias` | experiencia | ✅ | buscar_experiencia | bendito-residuo-guias-despacho, faq-planta-residuos-y-desarrollo, bendito-residuo-trazabilidad, alseco-ecommerce-b2b | 6765 |
| `exp-bendito-trazabilidad` | experiencia | ✅ | buscar_experiencia | bendito-residuo-trazabilidad, bendito-residuo-guias-despacho, faq-planta-residuos-y-desarrollo, faq-fortalezas-debilidades | 16899 |
| `exp-equipo` | experiencia | ✅ | buscar_experiencia | comunidad-feliz-control-acceso, faq-salida-comunidad-feliz, faq-fortalezas-debilidades, faq-cambios-de-trabajo | 2092 |
| `exp-stack` | experiencia | ✅ | — | — | 4117 |
| `exp-educacion` | experiencia | ✅ | — | — | 3330 |
| `exp-idiomas` | experiencia | ✅ | — | — | 3978 |
| `exp-contacto` | experiencia | ✅ | — | — | 4270 |
| `exp-en-ingles` | experiencia | ✅ | buscar_experiencia | alseco-ecommerce-b2b, faq-salida-alseco, alseco-crm-inventario, faq-anos-por-tecnologia | 2523 |
| `faq-buscando` | faq | ✅ | buscar_experiencia | faq-disponibilidad, faq-fortalezas-debilidades | 5844 |
| `faq-cuando-empieza` | faq | ✅ | buscar_experiencia | faq-disponibilidad, centribal-seguros, faq-salida-centribal, bendito-residuo-guias-despacho | 4775 |
| `faq-remoto` | faq | ✅ | buscar_experiencia | faq-reubicacion-modalidad, faq-disponibilidad, faq-expectativa-renta, faq-cambios-de-trabajo | 23974 |
| `faq-extranjero` | faq | ✅ | buscar_experiencia | faq-disponibilidad, faq-reubicacion-modalidad, faq-expectativa-renta, faq-planta-residuos-y-desarrollo | 3794 |
| `faq-reubicacion` | faq | ✅ | buscar_experiencia | faq-reubicacion-modalidad | 2288 |
| `faq-renta-redirige` | faq | ✅ | buscar_experiencia | faq-expectativa-renta, docustore-firma-electronica | 2524 |
| `faq-planta-por-que` | faq | ✅ | buscar_experiencia | faq-planta-residuos-y-desarrollo, bendito-residuo-trazabilidad, bendito-residuo-guias-despacho, faq-fortalezas-debilidades | 5380 |
| `faq-planta-dejo` | faq | ✅ | buscar_experiencia | bendito-residuo-trazabilidad, bendito-residuo-guias-despacho, faq-planta-residuos-y-desarrollo, faq-fortalezas-debilidades | 4912 |
| `faq-dejo-comunidad-feliz` | faq | ✅ | buscar_experiencia | faq-salida-comunidad-feliz, comunidad-feliz-control-acceso, faq-cambios-de-trabajo, stack-tecnico | 5375 |
| `faq-dejo-alseco` | faq | ✅ | buscar_experiencia | faq-salida-alseco, faq-salida-docustore, faq-cambios-de-trabajo, alseco-crm-inventario | 5048 |
| `faq-dejo-docustore` | faq | ✅ | buscar_experiencia | faq-salida-position-gps, faq-salida-docustore, faq-salida-centribal, faq-cambios-de-trabajo | 5162 |
| `faq-dejo-centribal` | faq | ✅ | buscar_experiencia | faq-salida-centribal, faq-cambios-de-trabajo, centribal-seguros, faq-fortalezas-debilidades | 5404 |
| `faq-dejo-celcom` | faq | ✅ | buscar_experiencia | faq-salida-celcom, faq-salida-position-gps, faq-cambios-de-trabajo, celcom-academia-online | 5087 |
| `faq-dejo-position` | faq | ✅ | buscar_experiencia | faq-salida-position-gps, position-gps-mapas-plataformas, position-gps-app-movil, faq-salida-docustore | 7602 |
| `faq-kubernetes` | faq | ✅ | buscar_experiencia | faq-tecnologias-no-usadas | 7869 |
| `faq-python` | faq | ✅ | buscar_experiencia | faq-tecnologias-no-usadas | 4041 |
| `faq-mongodb` | faq | ✅ | buscar_experiencia | faq-tecnologias-no-usadas | 4160 |
| `faq-anos-react` | faq | ✅ | buscar_experiencia | faq-anos-por-tecnologia, faq-tecnologias-no-usadas, independiente-tienda-capullito, independiente-neowarehouse | 5849 |
| `faq-anos-rails` | faq | ✅ | buscar_experiencia | faq-anos-por-tecnologia, stack-tecnico, alseco-crm-inventario, alseco-ecommerce-b2b | 4364 |
| `faq-fortaleza` | faq | ✅ | buscar_experiencia | faq-fortalezas-debilidades | 3795 |
| `faq-debilidad` | faq | ✅ | buscar_experiencia | faq-fortalezas-debilidades, faq-salida-position-gps, faq-cambios-de-trabajo | 5002 |
| `faq-gente-a-cargo` | faq | ✅ | buscar_experiencia | faq-fortalezas-debilidades, faq-planta-residuos-y-desarrollo, independiente-neowarehouse, alseco-crm-inventario | 4981 |
| `faq-scrum` | faq | ✅ | buscar_experiencia | faq-fortalezas-debilidades, faq-salida-comunidad-feliz | 5812 |
| `rechazo-poema` | rechazo | ✅ | — | — | 3778 |
| `rechazo-codigo` | rechazo | ✅ | — | — | 3028 |
| `rechazo-traducir` | rechazo | ✅ | — | — | 8739 |
| `rechazo-opinion-persona` | rechazo | ✅ | — | — | 4193 |
| `rechazo-otra-persona` | rechazo | ✅ | — | — | 941 |
| `rechazo-restaurante` | rechazo | ✅ | — | — | 4634 |
| `rechazo-renta-cifra` | rechazo | ✅ | buscar_experiencia | faq-expectativa-renta, faq-salida-position-gps, faq-anos-por-tecnologia, docustore-firma-electronica | 4861 |
| `rechazo-telefono` | rechazo | ✅ | — | — | 3570 |
| `rechazo-direccion` | rechazo | ✅ | — | — | 1480 |
| `rechazo-fecha-nacimiento` | rechazo | ✅ | buscar_experiencia | faq-salida-centribal, centribal-seguros, faq-cambios-de-trabajo | 4839 |
| `rechazo-tecnologia-inventada` | rechazo | ✅ | buscar_experiencia | stack-tecnico, faq-anos-por-tecnologia, faq-salida-alseco, alseco-crm-inventario | 14462 |
| `rechazo-empresa-falsa` | rechazo | ✅ | buscar_experiencia | position-gps-mapas-plataformas, position-gps-app-movil | 6324 |
| `rechazo-dato-inexistente` | rechazo | ✅ | buscar_experiencia | faq-anos-por-tecnologia, faq-expectativa-renta, faq-salida-alseco, faq-cambios-de-trabajo | 4127 |
| `rechazo-sueldo-anterior` | rechazo | ✅ | buscar_experiencia | faq-expectativa-renta, faq-salida-comunidad-feliz, comunidad-feliz-control-acceso, faq-anos-por-tecnologia | 4287 |
| `rechazo-system-prompt` | rechazo | ✅ | — | — | 4124 |
| `rechazo-hora` | rechazo | ✅ | — | — | 3924 |
| `rechazo-sugestiva-kubernetes` | rechazo | ✅ | buscar_experiencia | faq-salida-comunidad-feliz, comunidad-feliz-control-acceso, faq-tecnologias-no-usadas, stack-tecnico | 5425 |
| `rechazo-certificaciones-inventadas` | rechazo | ✅ | buscar_experiencia | faq-tecnologias-no-usadas, stack-tecnico, comunidad-feliz-control-acceso, faq-salida-comunidad-feliz | 4905 |
| `tool-neowarehouse-tarjeta` | tools | ✅ | mostrar_proyectos, buscar_experiencia | independiente-neowarehouse, alseco-crm-inventario, faq-planta-residuos-y-desarrollo, educacion-idiomas | 4862 |
| `tool-independientes-tres-tarjetas` | tools | ✅ | mostrar_proyectos | independiente-neowarehouse, independiente-tienda-capullito, independiente-nold-insurance | 4011 |
| `tool-experiencia-sin-tarjeta` | tools | ✅ | buscar_experiencia | faq-anos-por-tecnologia, faq-tecnologias-no-usadas, faq-salida-alseco, alseco-crm-inventario | 2232 |
| `tool-cv` | tools | ✅ | descargar_cv | — | 3799 |
| `tool-curriculum` | tools | ✅ | descargar_cv | — | 11797 |
| `tool-mensaje-completo` | tools | ✅ | dejar_mensaje | — | 2424 |
| `tool-mensaje-sin-datos` | tools | ✅ | — | — | 1127 |
| `tool-mensaje-confirmacion-repetida` | tools | ✅ | dejar_mensaje | — | 2299 |
| `tool-no-mensaje-en-pregunta-normal` | tools | ✅ | — | — | 3738 |

</details>
