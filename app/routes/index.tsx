import { redirect } from 'react-router';
import { firstPageSlug } from '~/lib/docs';

export function loader() {
	return redirect(`/${firstPageSlug()}`);
}
