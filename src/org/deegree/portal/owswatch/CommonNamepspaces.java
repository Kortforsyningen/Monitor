//$HeadURL: svn+ssh://rbezema@svn.wald.intevation.org/deegree/base/branches/2.3_testing/src/org/deegree/portal/owswatch/CommonNamepspaces.java $
/*----------------------------------------------------------------------------
 This file is part of deegree, http://deegree.org/
 Copyright (C) 2001-2009 by:
   Department of Geography, University of Bonn
 and
   lat/lon GmbH

 This library is free software; you can redistribute it and/or modify it under
 the terms of the GNU Lesser General Public License as published by the Free
 Software Foundation; either version 2.1 of the License, or (at your option)
 any later version.
 This library is distributed in the hope that it will be useful, but WITHOUT
 ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 details.
 You should have received a copy of the GNU Lesser General Public License
 along with this library; if not, write to the Free Software Foundation, Inc.,
 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA

 Contact information:

 lat/lon GmbH
 Aennchenstr. 19, 53177 Bonn
 Germany
 http://lat-lon.de/

 Department of Geography, University of Bonn
 Prof. Dr. Klaus Greve
 Postfach 1147, 53001 Bonn
 Germany
 http://www.geographie.uni-bonn.de/deegree/

 e-mail: info@deegree.org
----------------------------------------------------------------------------*/

package org.deegree.portal.owswatch;

import java.net.URI;

import org.deegree.framework.xml.NamespaceContext;
import org.deegree.ogcbase.CommonNamespaces;

/**
 * CommonNamespaces class for owsWatch
 *
 * @author <a href="mailto:elmasry@lat-lon.de">Moataz Elmasry</a>
 * @author last edited by: $Author: jmays $
 *
 * @version $Revision: 20271 $, $Date: 2009-10-21 13:07:15 +0200 (Mi, 21. Okt 2009) $
 */
public class CommonNamepspaces {

    private static NamespaceContext cnxt = null;

    /**
     * @return The CommonNamespacecontext of owsWatch + deegree
     */
    public static NamespaceContext getNameSpaceContext() {
        if ( cnxt == null ) {
            cnxt = CommonNamespaces.getNamespaceContext();
            // cnxt.addNamespace( DEEGREEWC_PREFIX, DEEGREEWSNS );
            // cnxt.addNamespace( DEEGREEWC_PREFIX, DEEGREEWCNS );
        }
        return cnxt;
    }

    /**
     *
     */
    public static final String DEEGREEWC_PREFIX = "wc";

    /**
     *
     */
    public static final String DEEGREEWS_PREFIX = "ws";

    /**
     *
     */
    public static final URI DEEGREEWSNS = CommonNamespaces.buildNSURI( "http://www.deegree.org/owswatch/services" );

    /**
     *
     */
    public static final URI DEEGREEWCNS = CommonNamespaces.buildNSURI( "http://www.deegree.org/owswatch/config" );

}
